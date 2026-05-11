const bookingForm = document.querySelector('#booking-form');
const toast = document.querySelector('#app-toast');
const ridesContainer = document.querySelector('#recent-rides');
const helpList = document.querySelector('#help-list');
const supportForm = document.querySelector('#support-form');
const supportIssue = document.querySelector('#support-issue');

// Fare matrix for locations A to F
const fareMatrix = {
  'A-B': 30, 'A-C': 50, 'A-D': 70, 'A-E': 90, 'A-F': 110,
  'B-A': 30, 'B-C': 30, 'B-D': 50, 'B-E': 70, 'B-F': 90,
  'C-A': 50, 'C-B': 30, 'C-D': 30, 'C-E': 50, 'C-F': 70,
  'D-A': 70, 'D-B': 50, 'D-C': 30, 'D-E': 30, 'D-F': 50,
  'E-A': 90, 'E-B': 70, 'E-C': 50, 'E-D': 30, 'E-F': 30,
  'F-A': 110, 'F-B': 90, 'F-C': 70, 'F-D': 50, 'F-E': 30
};

function calculateFare(pickup, drop) {
  if (!pickup || !drop) return 0;
  if (pickup === drop) return 0;
  const key = `${pickup}-${drop}`;
  return fareMatrix[key] || 0;
}

function updateFareDisplay() {
  if (!bookingForm) return;
  const pickup = bookingForm.elements.pickup.value;
  const drop = bookingForm.elements.drop.value;
  const fareDisplay = document.querySelector('#fare-display');
  const fareAmount = document.querySelector('#fare-amount');
  
  if (pickup && drop && pickup !== drop) {
    const fare = calculateFare(pickup, drop);
    fareAmount.textContent = `₹ ${fare}`;
    fareDisplay.style.display = 'block';
  } else {
    fareDisplay.style.display = 'none';
  }
}

const profileSlots = {
  name: document.querySelector('#profile-name'),
  membership: document.querySelector('#profile-membership'),
  balance: document.querySelector('#wallet-balance'),
  credits: document.querySelector('#ride-credits'),
  memberSince: document.querySelector('#member-since'),
  defaultPayment: document.querySelector('#default-payment'),
  preferredService: document.querySelector('#preferred-service'),
  favoriteRoute: document.querySelector('#favorite-route'),
  avatar: document.querySelector('#profile-avatar'),
  fastestPickup: document.querySelector('#fastest-pickup'),
  rating: document.querySelector('#profile-rating'),
  ridesThisMonth: document.querySelector('#rides-this-month')
};

if (bookingForm) {
  bookingForm.elements.pickup.addEventListener('change', updateFareDisplay);
  bookingForm.elements.drop.addEventListener('change', updateFareDisplay);

  bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const pickup = bookingForm.elements.pickup.value.trim();
    const drop = bookingForm.elements.drop.value.trim();
    const service = 'Standard';
    const fare = calculateFare(pickup, drop);

    if (!pickup || !drop) {
      showToast('Please select both pickup and drop locations.', 'danger');
      return;
    }

    if (pickup === drop) {
      showToast('Pickup and drop locations must be different.', 'danger');
      return;
    }

    try {
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickup: `Location ${pickup}`, drop: `Location ${drop}`, service, price: fare })
      });

      if (!response.ok) {
        throw new Error('Failed to save ride booking.');
      }

      const ride = await response.json();
      showToast(`Ride booked: ${ride.service} from ${ride.pickup} to ${ride.drop}. Fare: ₹${fare}`, 'success');
      bookingForm.reset();
      updateFareDisplay();
      await loadRides();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });
}

if (supportForm) {
  supportForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const issue = supportIssue.value.trim();
    if (!issue) {
      showToast('Please describe your issue before submitting.', 'danger');
      return;
    }

    try {
      const response = await fetch('/api/help/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue })
      });

      if (!response.ok) {
        throw new Error('Unable to send support request.');
      }

      supportIssue.value = '';
      showToast('Support request submitted successfully.', 'success');
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });
}

async function fetchJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  } catch (error) {
    console.warn('Fetch failed:', error);
    return null;
  }
}

async function loadRides() {
  if (!ridesContainer) return;
  const rides = await fetchJson('/api/rides');
  if (!rides) {
    ridesContainer.innerHTML = '<article class="ride-card"><div class="ride-row"><div><strong>Unable to load rides.</strong></div></div></article>';
    return;
  }

  ridesContainer.innerHTML = rides.slice(0, 4).map((ride) => {
    return `
      <article class="ride-card">
        <div class="ride-row">
          <div>
            <strong>${ride.service}</strong>
            <span>Pickup: ${ride.pickup}</span>
          </div>
          <div class="status-pill ${ride.status === 'Completed' ? 'status-active' : 'status-active'}">${ride.status}</div>
        </div>
        <span>Drop: ${ride.drop}</span>
        <span>${ride.date} · ₹${ride.price}</span>
      </article>
    `;
  }).join('');
}

async function loadHelp() {
  if (!helpList) return;
  const helpItems = await fetchJson('/api/help');
  if (!helpItems) {
    helpList.innerHTML = '<li><strong>Unable to load help content.</strong></li>';
    return;
  }

  helpList.innerHTML = helpItems.map((item) => {
    return `
      <li>
        <strong>${item.question}</strong>
        <p>${item.answer}</p>
      </li>
    `;
  }).join('');
}

async function loadProfile() {
  if (!profileSlots.name) return;
  const profile = await fetchJson('/api/profile');
  if (!profile) return;

  profileSlots.name.textContent = profile.name;
  profileSlots.membership.textContent = profile.membership;
  profileSlots.balance.textContent = `₹${profile.walletBalance}`;
  profileSlots.credits.textContent = profile.rideCredits;
  profileSlots.memberSince.textContent = profile.memberSince;
  profileSlots.defaultPayment.value = profile.defaultPayment;
  profileSlots.preferredService.value = profile.preferredService;
  profileSlots.favoriteRoute.value = profile.favoriteRoute;
  profileSlots.avatar.textContent = profile.name ? profile.name.charAt(0) : 'F';
}

function showToast(message, type) {
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 3200);
}

loadRides();
loadHelp();
loadProfile();
