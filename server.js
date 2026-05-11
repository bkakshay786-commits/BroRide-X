require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup lowdb
const adapter = new JSONFile('db.json');
const db = new Low(adapter, {
  rides: [],
  profile: null,
  help: [],
  supportRequests: []
});

const robots = [
  { robotId: 'Robo-1', battery: 88, status: 'Available', currentLocation: 'Gate A' },
  { robotId: 'Robo-2', battery: 74, status: 'Available', currentLocation: 'Gate B' },
  { robotId: 'Robo-3', battery: 52, status: 'Busy', currentLocation: 'Terminal C' }
];

const pricingMap = {
  Mini: 220,
  Prime: 340,
  'Airport Express': 520
};

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function calculatePrice(service) {
  return pricingMap[service] || 260;
}

async function seedDefaults() {
  await db.read();

  if (!db.data.profile) {
    db.data.profile = {
      name: 'Riya Sharma',
      membership: 'Platinum Member',
      walletBalance: 430,
      rideCredits: '2 rides free',
      favoriteRoute: 'Home → Office',
      preferredPayment: 'UPI • pay@flash',
      preferredService: 'Mini',
      avatar: 'R',
      stats: {
        fastestPickup: '4 mins',
        rating: '4.9/5',
        ridesThisMonth: 12
      }
    };
  }

  if (db.data.help.length === 0) {
    db.data.help = [
      {
        question: 'How do I change my pickup location?',
        answer: 'Update pickup and drop locations before booking, then confirm the ride.'
      },
      {
        question: 'Can I pay by UPI?',
        answer: 'Yes. BroRide X supports UPI, cards, and wallet payments for quick checkout.'
      },
      {
        question: 'How do I get a receipt?',
        answer: 'Receipts will be sent to your registered email after the ride is completed.'
      }
    ];
  }

  await db.write();
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/rides', asyncHandler(async (req, res) => {
  await db.read();
  const rides = db.data.rides.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(rides);
}));

app.post('/api/rides', asyncHandler(async (req, res) => {
  const { pickup, drop, service, price } = req.body;
  if (!pickup || !drop) {
    return res.status(400).json({ error: 'pickup and drop are required' });
  }

  const ride = {
    pickup,
    drop,
    service: service || 'Standard',
    status: 'Confirmed',
    price: price || calculatePrice(service || 'Standard'),
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date()
  };

  await db.read();
  db.data.rides.push(ride);
  await db.write();

  res.status(201).json(ride);
}));

app.get('/api/profile', asyncHandler(async (req, res) => {
  await db.read();
  res.json(db.data.profile);
}));

app.get('/api/help', asyncHandler(async (req, res) => {
  await db.read();
  res.json(db.data.help);
}));

app.post('/api/help/request', asyncHandler(async (req, res) => {
  const { issue } = req.body;
  if (!issue) {
    return res.status(400).json({ error: 'issue is required' });
  }

  const supportRequest = { issue, status: 'Pending', createdAt: new Date() };

  await db.read();
  db.data.supportRequests.push(supportRequest);
  await db.write();

  res.status(201).json({ message: 'Support request submitted', request: supportRequest });
}));

app.post('/api/robot/assign', asyncHandler(async (req, res) => {
  const availableRobot = robots.find((robot) => robot.status === 'Available');
  if (!availableRobot) {
    return res.status(404).json({ error: 'No available robotaxi at the moment.' });
  }

  availableRobot.status = 'Assigned';
  availableRobot.eta = '4 mins';

  res.json({
    robotId: availableRobot.robotId,
    eta: availableRobot.eta,
    battery: availableRobot.battery,
    currentLocation: availableRobot.currentLocation
  });
}));

app.get('/api/dashboard', asyncHandler(async (req, res) => {
  await db.read();
  const profile = db.data.profile;
  const rides = db.data.rides.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const faq = db.data.help;
  res.json({ profile, rides, help: faq });
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
seedDefaults().then(() => {
  app.listen(PORT, () => {
    console.log(`BroRide X backend running on http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error.message);
  process.exit(1);
});



  

  
   