import axios from 'axios';

// Allow override via environment variables when running this script locally.
// Accepts: API_URL (full path including /api) or API_BASE (base url without /api)
const API_BASE = process.env.API_BASE || process.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = (process.env.API_URL || `${API_BASE.replace(/\/$/, '')}/api`);

async function fixHoliday() {
    try {
        // 1. Login as Admin
        console.log('Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'megamart.dvst@gmail.com',
            password: 'edutalks@321'
        });
        const token = loginRes.data.accessToken;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Get Holidays
        console.log('Fetching holidays...');
        const holidaysRes = await axios.get(`${API_URL}/holidays`, { headers });
        const holidays = holidaysRes.data;

        // 3. Find "New Year Updated"
        const newYear = holidays.find(h => h.name.includes('New Year'));

        if (newYear) {
            console.log(`Found holiday: ${newYear.name} (${newYear.holidayDate})`);
            // 4. Update it
            console.log('Updating to 2026-01-01...');
            await axios.put(`${API_URL}/holidays/${newYear.id}`, {
                name: newYear.name,
                holidayDate: '2026-01-01',
                description: newYear.description
            }, { headers });
            console.log('Holiday updated successfully!');
        } else {
            console.log('New Year holiday not found. Creating it...');
            await axios.post(`${API_URL}/holidays`, {
                name: 'New Year 2026',
                holidayDate: '2026-01-01',
                description: 'New Year Celebration'
            }, { headers });
            console.log('Holiday created successfully!');
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

fixHoliday();
