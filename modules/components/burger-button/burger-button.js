export class BurgerButton {
  constructor({ onClick, active = false } = {}) {
    const html = `
      <button class="button burger-button ${active ? 'is-active' : ''}" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    `;
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    this.el = tpl.content.firstChild;
    if (onClick) this.el.addEventListener('click', () => {
      onClick(this)
    });
  }

  appendTo(parent) {
    parent.append(this.el);
    return this
  }

  toggle() {
    this.el.classList.toggle('is-active');
  }

  setActive(state) {
    this.el.classList.toggle('is-active', state);
  }
}