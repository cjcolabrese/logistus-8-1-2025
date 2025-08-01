const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User')
const bcrypt = require('bcryptjs')

/* GET home page. */
router.get('/login', function(req, res, next) {
    res.render('auth/login', { title: 'Express' });
});
router.get('/register', function(req, res, next) {
    res.render('register', { title: 'Express' });
});
router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/'
}), async (req, res) => {
    try {
        // Check if the user has completed their profile
        const user = req.user;

        //Assuming the 'isProfileComplete' flag indicates whether profile is complete
        if (!user.isProfileComplete) {
            return res.redirect('/complete-profile');
        }

        // If profile is complete, redirect to dashboard
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error during Google OAuth callback:', error);
        res.redirect('/');
    }
});
router.get('/microsoft', passport.authenticate('microsoft'));
router.get('/microsoft/callback', passport.authenticate('microsoft', {
    failureRedirect: '/'
}), async (req, res) => {
    try {
        // Check if the user has completed their profile
        const user = req.user;

        // Assuming the 'isProfileComplete' flag indicates whether profile is complete
        if (!user.isProfileComplete) {
            return res.redirect('/complete-profile');
        }

        // If profile is complete, redirect to dashboard
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error during Microsoft OAuth callback:', error);
        res.redirect('/');
    }
});
router.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/auth/login'));
});
router.post('/complete-profile', async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.redirect('/');
        }

        const {
            phoneNumber,
            userType,
            industry,
            dotNumber,
            companyName,
            address,   // Street address
            city,
            state,
            zip
        } = req.body;

        // Combine full address into a single formatted string
        const fullAddress = `${address}, ${city}, ${state} ${zip}`;

        // Update the user's profile
        await User.findByIdAndUpdate(req.user._id, {
            phoneNumber,
            userType,
            industry,
            dotNumber,
            companyName,
            address: fullAddress, // Save formatted address string
            isProfileComplete: true
        });

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.render('complete-profile', { error: 'Failed to update profile.' });
    }
});

router.get('/login', async(req, res) => {
    res.render('login')
})
module.exports = router;