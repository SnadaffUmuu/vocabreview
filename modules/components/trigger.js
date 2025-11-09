export class Trigger {
  constructor({ active = false, html }) {
    if (new.target === Trigger) {
      throw new Error('Trigger is abstract and cannot be instantiated directly');
    }    
    if (!html) throw new Error('Subclass must provide html.');

    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    this.el = tpl.content.firstChild;

    if (active) this.el.classList.add('is-active');

    this.el.addEventListener('click', () => {
      this.toggle();
      this.el.dispatchEvent(new CustomEvent('trigger:toggle', {
        bubbles: true,
        detail: { active: this.isActive() }
      }));
    });
  }

  appendTo(parent) {
    parent.append(this.el);
    return this;
  }

  toggle() {
    this.el.classList.toggle('is-active');
  }

  isActive() {
    return this.el.classList.contains('is-active');
  }

  setActive(state) {
    this.el.classList.toggle('is-active', state);
  }
}
