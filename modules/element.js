export const Element = function () { };

Element.prototype = {

  templatePath: null,

  templateSelector: null,

  templateHtmls: {},

  template: null,

  initTemplate: async function () {
    try {
      document.body.insertAdjacentHTML(
        'afterbegin',
        this.templateHtmls[this._class.name].templateHtml
      );
      this.template = document.body
        .querySelector(this.templateSelector);
      if (this.template == null) {
        throw new Error('Element nof found for selector ' + this.templateSelector);
      }
      document.body.removeChild(this.template);
    } catch (error) {
      console.error('Error initializing template:', error);
      throw error;
    }
  },

  getElement() {
    return this.template.cloneNode(true);
  },

  initElementTemplateHtml: async function () {
    if (!Element.prototype.templateHtmls[this._class.name]
      || !Element.prototype.templateHtmls[this._class.name]._templateHtmlPromise) {
        Element.prototype.templateHtmls[this._class.name] = {};
      Element.prototype.templateHtmls[this._class.name]._templateHtmlPromise = (async () => {
        const response = await fetch(this.templatePath);
        Element.prototype.templateHtmls[this._class.name].templateHtml = await response.text();
        return Element.prototype.templateHtmls[this._class.name].templateHtml;
      })()
    }
    await Element.prototype.templateHtmls[this._class.name]._templateHtmlPromise;
  },

  init: async function () {
    await this.initElementTemplateHtml();
    if (this.templatePath == null) {
      throw new Error('template path not defined');
    }
    try {
      this.initTemplate();
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  },

};
Element.create = async function (SubClass, ...args) {
  if (!Object.prototype.isPrototypeOf.call(Element.prototype, SubClass.prototype)) {
    SubClass.prototype = Object.create(Element.prototype);
    SubClass.prototype.constructor = SubClass;
  }
  if (!SubClass.prototype.defaults && SubClass.prototype.constructor.defaults) {
    SubClass.prototype.defaults = SubClass.prototype.constructor.defaults;
  }
  const instance = new SubClass(...args);
  instance._class = SubClass;

  await instance.init();
  return instance;
};
