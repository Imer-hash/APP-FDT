// Data keys for localStorage
const CLIENTS_KEY = 'fumigadora_clients';
const APPOINTMENTS_KEY = 'fumigadora_appointments';

// DOM elements
const clientsBtn = document.getElementById('clientsBtn');
const appointmentsBtn = document.getElementById('appointmentsBtn');
const clientsSection = document.getElementById('clientsSection');
const appointmentsSection = document.getElementById('appointmentsSection');

const clientForm = document.getElementById('clientForm');
const clientNameInput = document.getElementById('clientName');
const clientPhoneInput = document.getElementById('clientPhone');
const clientAddressInput = document.getElementById('clientAddress');
const clientObservationInput = document.getElementById('clientObservation');
const clientList = document.getElementById('clientList');

const appointmentForm = document.getElementById('appointmentForm');
const clientSelect = document.getElementById('clientSelect');
const appointmentDateInput = document.getElementById('appointmentDate');
const appointmentObservationInput = document.getElementById('appointmentObservation');
const fumigationTypeInput = document.getElementById('fumigationType');
const appointmentList = document.getElementById('appointmentList');

let clients = [];
let appointments = [];

// Initialize app
function init() {
    loadData();
    renderClients();
    renderClientOptions();
    renderAppointments();
    // Removed call to undefined setupEventListeners
    requestNotificationPermission();
    checkReminders();
    setInterval(checkReminders, 60000); // Check reminders every minute
}

// Load data from localStorage
function loadData() {
    const clientsData = localStorage.getItem(CLIENTS_KEY);
    const appointmentsData = localStorage.getItem(APPOINTMENTS_KEY);
    clients = clientsData ? JSON.parse(clientsData) : [];
    appointments = appointmentsData ? JSON.parse(appointmentsData) : [];
}

// Save data to localStorage
function saveData() {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
}

// Render clients list
function renderClients() {
    clientList.innerHTML = '';
    clients.forEach((client, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${client.name}</strong> - ${client.phone}<br/>
                        <em>Dirección:</em> ${client.address || 'N/A'}<br/>
                        <em>Observación:</em> ${client.observation || 'N/A'}`;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', () => {
            deleteClient(index);
        });
        li.appendChild(deleteBtn);
        clientList.appendChild(li);
    });
}

// Render client options in appointment form
function renderClientOptions() {
    clientSelect.innerHTML = '<option value="">Seleccione un cliente</option>';
    clients.forEach((client, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = client.name;
        clientSelect.appendChild(option);
    });
}

// Render appointments list
function renderAppointments() {
    appointmentList.innerHTML = '';
    appointments.forEach((appointment, index) => {
        const client = clients[appointment.clientIndex];
        if (!client) return; // Skip if client was deleted
        const li = document.createElement('li');
        li.innerHTML = `<strong>${client.name}</strong> - <span class="appointment-time">${new Date(appointment.date).toLocaleString()}</span><br/>
                        <em>Observación:</em> ${appointment.observation || 'N/A'}<br/>
                        <em>Tipo de fumigación:</em> ${appointment.fumigationType || 'N/A'}`;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', () => {
            deleteAppointment(index);
        });
        li.appendChild(deleteBtn);
        appointmentList.appendChild(li);
    });
}

// Add new client
clientForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = clientNameInput.value.trim();
    const phone = clientPhoneInput.value.trim();
    const address = clientAddressInput.value.trim();
    const observation = clientObservationInput.value.trim();
    if (name && phone) {
        clients.push({ name, phone, address, observation });
        saveData();
        renderClients();
        renderClientOptions();
        clientForm.reset();
    }
});

// Add new appointment
appointmentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const clientIndex = clientSelect.value;
    const date = appointmentDateInput.value;
    const observation = appointmentObservationInput.value.trim();
    const fumigationType = fumigationTypeInput.value.trim();
    if (clientIndex !== '' && date) {
        appointments.push({ clientIndex: parseInt(clientIndex), date, observation, fumigationType });
        saveData();
        renderAppointments();
        appointmentForm.reset();
    }
});

// Delete client and associated appointments
function deleteClient(index) {
    clients.splice(index, 1);
    // Remove appointments for deleted client
    appointments = appointments.filter(app => app.clientIndex !== index);
    // Adjust clientIndex in appointments
    appointments = appointments.map(app => {
        if (app.clientIndex > index) {
            return { ...app, clientIndex: app.clientIndex - 1 };
        }
        return app;
    });
    saveData();
    renderClients();
    renderClientOptions();
    renderAppointments();
}

// Delete appointment
function deleteAppointment(index) {
    appointments.splice(index, 1);
    saveData();
    renderAppointments();
}

// Switch between clients and appointments sections
clientsBtn.addEventListener('click', () => {
    clientsBtn.classList.add('active');
    appointmentsBtn.classList.remove('active');
    clientsSection.classList.add('active');
    appointmentsSection.classList.remove('active');
});

appointmentsBtn.addEventListener('click', () => {
    appointmentsBtn.classList.add('active');
    clientsBtn.classList.remove('active');
    appointmentsSection.classList.add('active');
    clientsSection.classList.remove('active');
});

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

// Check for upcoming appointments and show reminders
function checkReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }
    const now = new Date();
    appointments.forEach(appointment => {
        const appointmentDate = new Date(appointment.date);
        const diff = (appointmentDate - now) / 60000; // difference in minutes
        if (diff > 0 && diff <= 10) { // remind if appointment is within next 10 minutes
            const client = clients[appointment.clientIndex];
            if (client) {
                showNotification(`Próxima cita con ${client.name}`, `A las ${appointmentDate.toLocaleTimeString()}`);
            }
        }
    });
}

// Show browser notification
function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body });
    }
}

init();
