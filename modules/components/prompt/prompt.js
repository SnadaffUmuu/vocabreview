export class Prompt {
  constructor({
    text,
    onConfirm = () => {},
    onCancel = () => {},
  }) {
    const html = `
    <div class="prompt-overlay">
      <div class="prompt">
         <div class="prompt-text">${text}</div>
          <div class="prompt-buttons">
          <button data-action="confirm">Confirm</button>
          <button data-action="cancel">Cancel</button>
        </div>
      </div>
    </div>
    `;

    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    this.el = tpl.content.firstChild;
    document.body.append(this.el)

    this.el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;

      if (action === 'confirm') onConfirm();
      if (action === 'cancel') onCancel();

      this.close();
    });
  }

  close() {
    this.el.remove()
  }

}