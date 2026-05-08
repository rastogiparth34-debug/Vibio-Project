document.addEventListener('DOMContentLoaded', () => {
    const authButtonsContainer = document.querySelector('.auth-buttons');
    const storedUser = localStorage.getItem('vibio_current_user');

    if (storedUser && authButtonsContainer) {
        try {
            const user = JSON.parse(storedUser);
            // Use first name if possible, fallback to "User"
            const name = user.fullName ? user.fullName.split(' ')[0] : 'User'; 
            
            const hour = new Date().getHours();
            let greeting = 'Good evening';
            if (hour >= 5 && hour < 12) {
                greeting = 'Good morning';
            } else if (hour >= 12 && hour < 18) {
                greeting = 'Good afternoon';
            }

            // Replace the login/signup buttons with the greeting and a logout button
            authButtonsContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="color: #c4b5fd; font-weight: 600; font-size: 1rem;">
                        ${greeting}, ${name}!
                    </span>
                    <button id="logoutBtn" style="background: rgba(192, 132, 252, 0.1); border: 1px solid rgba(192, 132, 252, 0.3); color: #c4b5fd; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;">
                        Logout
                    </button>
                </div>
            `;

            // Hover effect and click handler for logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('mouseover', () => {
                    logoutBtn.style.background = 'rgba(192, 132, 252, 0.2)';
                    logoutBtn.style.color = '#fff';
                });
                logoutBtn.addEventListener('mouseout', () => {
                    logoutBtn.style.background = 'rgba(192, 132, 252, 0.1)';
                    logoutBtn.style.color = '#c4b5fd';
                });
                
                // Add click handler to log out
                logoutBtn.addEventListener('click', () => {
                    localStorage.removeItem('vibio_current_user');
                    window.location.reload();
                });
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
});
