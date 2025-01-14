document.querySelectorAll('.cta-button, .tool-button, .contact-links a').forEach((element) => {
  element.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default action
    const targetUrl = event.target.href; // Capture the URL for redirection
    const { top, left, width, height } = event.target.getBoundingClientRect();
    const centerX = left + window.scrollX + width / 2;
    const centerY = top + window.scrollY + height / 2;

    for (let i = 0; i < 6; i++) { // Create 6 sparkles
      const sparkle = document.createElement('img');
      sparkle.src = 'assets/pineapple-icon.png';
      sparkle.className = 'sparkle';

      // Randomize horizontal direction
      const randomX = Math.random() > 0.5 ? 1 : -1; // Random left or right
      sparkle.style.setProperty('--x', `${randomX * (Math.random() * 50 + 50)}px`); // Random distance

      // Randomize animation delay and path direction
      sparkle.style.animationDelay = `${Math.random() * 0.3}s`;
      sparkle.style.left = `${centerX}px`;
      sparkle.style.top = `${centerY}px`;

      // Append sparkle to body
      document.body.appendChild(sparkle);

      // Remove sparkle after animation
      sparkle.addEventListener('animationend', () => {
        sparkle.remove();
      });
    }


    // Redirect after the animation (1-second delay)
    setTimeout(() => {
      if (targetUrl && targetUrl !== '#') {
        window.location.href = targetUrl; // Navigate to the target URL
      }
    }, 400); // 1 second delay
  });
});
