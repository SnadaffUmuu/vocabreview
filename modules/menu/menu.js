import { View } from "../view.js";

export const MenuView = function () {
  this.templateSelector = '#menuContainer';
  this.templatePath = 'modules/menu/menu.html';

  this.events = {
    'click #menuTrigger': 'toggleMenu',
  };

  this.toggleMenu = function (e) {
    e && e.preventDefault();
    var menu = this.find('#menu');
    var trigger = e.target;
    if (menu.classList.contains("isOpened")) {
      menu.classList.remove("isOpened")
      trigger.innerText = ">>"
    } else {
      menu.classList.add("isOpened")
      trigger.innerText = "<<"
    }
  };

};
MenuView.prototype = Object.create(View.prototype);
MenuView.prototype.constructor = MenuView;
MenuView.create = View.create;