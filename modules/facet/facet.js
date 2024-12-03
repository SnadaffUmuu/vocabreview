import { View } from "../view.js";

export const Facet = function (text, speakable, originalIndex) { 
  this.text = text;
  this.speakable = speakable;
  this.originalIndex = originalIndex;
};
Facet.prototype = Object.assign(Object.create(View.prototype), {
  
})