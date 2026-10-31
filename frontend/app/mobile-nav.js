/* LearnSphere AI — Mobile Navigation Handler */
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (hamburger && sidebar && overlay) {
    function toggleSidebar() {
      sidebar.classList.toggle('sidebar--open');
      overlay.classList.toggle('sidebar-overlay--open');
    }

    hamburger.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);
  }
});
