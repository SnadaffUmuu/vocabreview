var View = function () {};
View.prototype = {
  templatePath: null,
  init: async function () {
    if (!View.prototype._templateHtmlPromise) {
      View.prototype._templateHtmlPromise = (async () => {
        const response = await fetch(this.templatePath);
        // Сохраняем результат в прототип
        View.prototype.templateHtml = await response.text();
        return View.prototype.templateHtml;
      })();
    } else {
      await View.prototype._templateHtmlPromise;
      console.log(this.templatePath)
      console.log(this.templateHtml)
    }
  }
};

var MenuView = function () {
  this.templatePath = 'modules/menu/menu.html';
  this.init()
}
MenuView.prototype = new View();

async function initViews(){
  menuViewInstance = new MenuView()
}

let menuViewInstance = null;
await initViews();
debugger;
console.log(menuViewInstance) 




