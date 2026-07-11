const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');
const modal = document.querySelector('.portfolio-modal');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
});

menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.13 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.querySelectorAll('.portfolio-card').forEach(card => {
  card.addEventListener('click', () => {
    modal.querySelector('h2').textContent = card.dataset.title;
    modal.querySelector('.modal-copy').textContent = card.dataset.copy;
    modal.showModal();
  });
});

modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => {
  const rect = modal.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
                 event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) modal.close();
});

document.getElementById('year').textContent = new Date().getFullYear();
