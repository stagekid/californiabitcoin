window.CABTLab = {
  handleSubmit: (e) => {
    e.preventDefault();
    const email = document.querySelector('#email')?.value?.trim();
    if (!email) return false;

    // Placeholder behavior for now:
    alert("Thanks! We'll email you when we launch. ✅");
    e.target.reset();

    // Later: replace this with your ConvertKit/Beehiiv form action
    // or send to a Worker endpoint.
    return false;
  }
};

(function init(){
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const modeBtn = document.getElementById('modeBtn');
  const saved = localStorage.getItem('cablab_theme');
  if (saved === 'light') document.body.classList.add('light');

  modeBtn?.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('cablab_theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });
})();
