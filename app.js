require('dotenv').config({path: './config/config.env'});
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const hbs = require('hbs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');
const helmet = require('helmet');
const fs = require('fs');
require('./config/passport')(passport);

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');
const shipmentRouter = require('./routes/shipments');
const accountRouter = require('./routes/accounts');
const documentsRouter = require('./routes/documents');

const app = express();

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register partials with error handling
const partialsDir = path.join(__dirname, 'views', 'partials');

// Verify directory exists
if (!fs.existsSync(partialsDir)) {
  console.error(`❌ Partials directory not found: ${partialsDir}`);
  // Optionally create the directory if it doesn't exist
  fs.mkdirSync(partialsDir, { recursive: true });
  console.log(`✅ Created partials directory: ${partialsDir}`);
}

// Register partials
hbs.registerPartials(partialsDir, (err) => {
  if (err) {
    console.error('❌ Failed to register partials:', err);
    return;
  }

  // Log registered partials
  fs.readdir(partialsDir, (err, files) => {
    if (err) {
      console.error('❌ Could not list partials:', err);
      return;
    }

    const hbsFiles = files.filter(f => f.endsWith('.hbs'));
    console.log(`✅ Registered ${hbsFiles.length} partials:`);
    hbsFiles.forEach(f => console.log(`  - ${f}`));
  });
});
hbs.registerHelper('eq', function (a, b) {
  return a === b;
});
hbs.registerHelper('or', function() {
  const args = Array.prototype.slice.call(arguments, 0, -1);
  return args.some(arg => !!arg);
});
hbs.registerHelper('formatDate', function(date) {
  if (!date) return '';
  const d = new Date(date);
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${month}/${day}/${year}`;
});

hbs.registerHelper('subtract', function (a, b) {
  return a - b;
});
hbs.registerHelper('gt', function (a, b) {
  return a > b;
});
hbs.registerHelper('eq', function(a, b) {
  return a === b ? 'selected' : '';  // Return 'selected' if equal, else empty string
});
hbs.handlebars.registerHelper('join', (arr, sep) => {
  if (!Array.isArray(arr) || !arr.length) return '';
  return arr.join(sep);
});
hbs.registerHelper('statusColor', status => {
  switch (status) {
    case 'Available': return 'secondary'; // green
    case 'Posted': return 'info';    // gray
    case 'Booked': return 'success';    // custom cyan
    case 'In Transit': return 'warning'; // yellow
    case 'Delivered': return 'dark'; // darker green
    case 'Cancelled': return 'danger';
    case 'Invoiced': return 'primary';// red
          case 'Paid': return 'success';
    default: return '#343a40';          // dark gray
  }
});
hbs.registerHelper('formatCurrency', value => {
  if (value == null || isNaN(value)) return '0.00';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
});

hbs.registerHelper('formatNumber', function (number) {
  if (typeof number !== 'number') return number;
  return number.toLocaleString('en-US');
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(logger('dev'));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/api', apiRouter)
app.use('/api/shipments', shipmentRouter)
app.use('/api/accounts', accountRouter);
app.use('/api/documents', documentsRouter)


app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));
app.listen(4000);
console.log('Server started at http://localhost:4000');


module.exports = app;
