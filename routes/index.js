var express = require('express');
var router = express.Router();
const Shipment  = require('../models/Shipment');
const Account  = require('../models/Account');
const Bid = require('../models/Bid');
const Notification = require('../models/Notification');


const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
function ensureAuthenticated(req, res, next) {
  console.log('Authenticated:', req.isAuthenticated());
  // console.log('User in Middleware:', req.user);
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/complete-profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('complete-profile', {user: req.user});
});

router.get('/dashboard', ensureAuthenticated, async (req, res, next) => {

  console.log(GOOGLE_API_KEY)
  try {
    const userId   = req.user._id;
    const userType = req.user.userType;

    let userShipments, completedCarrierShipments,
        invoicedShipments, paidShipments,
        cancelledShipments, postedShipments,
        activeShipments,
        userBids, shipperBids, userNotifications, proprietaryAccounts;


    userNotifications = await Notification.find({
      recipient: userId,
      isRead:    false
    });

    if (userType === 'Shipper') {
      userShipments        = await Shipment.find({ postedBy: userId }).sort({ createdAt: -1 });
      console.log("User Shipments:", userShipments)
      userBids             = await Bid.find({ shipper: userId });
      cancelledShipments   = await Shipment.find({ status: 'Cancelled', shipper: userId });
      invoicedShipments    = await Shipment.find({ isPaid: true,   shipper: userId });
      paidShipments        = invoicedShipments;
      proprietaryAccounts  = await Account.find({ createdBy: userId});
    }
    else if (userType === 'Carrier') {
      postedShipments          = await Shipment.find({ status: 'Available'});
      activeShipments          = await Shipment.find({ carrier: userId, status: { $in: ['Booked','In Transit'] } });
      completedCarrierShipments= await Shipment.find({ carrier: userId, status: 'Delivered' });
      invoicedShipments        = await Shipment.find({ isPaid: true, carrier: userId });
      paidShipments            = invoicedShipments;
    }
    if (userType === 'Carrier/Shipper') {
      userShipments        = await Shipment.find({ postedBy: userId }).sort({ createdAt: -1 });
      userBids             = await Bid.find({ shipper: userId });
      postedShipments          = await Shipment.find({ status: 'Available'});
      activeShipments          = await Shipment.find({ carrier: userId, status: { $in: ['Booked','In Transit'] } });
      completedCarrierShipments= await Shipment.find({ carrier: userId, status: 'Delivered' });
      invoicedShipments        = await Shipment.find({ isPaid: true, carrier: userId });
      paidShipments            = invoicedShipments;
    }

    console.log("Active SHipments for User:", activeShipments);
    // choose view
    let viewToRender;
    switch (userType) {
      case 'Carrier': viewToRender = 'dashboard-carrier'; break;
      case 'Shipper': viewToRender = 'dashboard-shipper'; break;
      case 'Carrier/Shipper': viewToRender = 'dashboard-hybrid'; break;
      case 'Admin':   viewToRender = 'dashboard-admin';   break;
      default:        viewToRender = 'dashboard';
    }

    res.render(viewToRender, {
      user: req.user,
      userShipments,
      postedShipments,
      activeShipments,
      completedCarrierShipments,
      cancelledShipments,
      invoicedShipments,
      paidShipments,
      userBids,
      userNotifications,
      proprietaryAccounts
    });
  }
  catch (err) {
    // Log it for debugging
    console.error('Error in GET /dashboard:', err);
    // Option A: forward to Express error handler
    return next(err);

    // Option B: render an error page or JSON
    // res.status(500).render('error', { message: 'Failed to load dashboard.', error: err });
    // or for an API: res.status(500).json({ error: 'Unable to fetch dashboard data.' });
  }
});
module.exports = router;
