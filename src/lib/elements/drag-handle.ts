import { emit } from "./events";

export class DragHandle extends HTMLElement {
  private coords = {
    elementX: 0,
    elementY: 0,
    mouseDeltaX: 0,
    mouseDeltaY: 0,
    mouseStartX: 0,
    mouseStartY: 0,
  };

  connectedCallback() {
    this.innerHTML = `
    <style>
    drag-handle {
      button {
        cursor: move;
      } 
    }
    </style>
    <button>⣿</button>
    `;

    this.dragElement(this);
  }

  // Make the DIV element draggable:

  private dragElement(elmnt: HTMLElement) {
    elmnt.onmousedown = this.dragMouseDown.bind(this);
  }

  private dragMouseDown(mouseEvent: MouseEvent) {
    mouseEvent.preventDefault();
    // get the mouse cursor position at startup:
    this.coords.mouseStartX = mouseEvent.clientX;
    this.coords.mouseStartY = mouseEvent.clientY;

    document.onmouseup = this.closeDragElement.bind(this);
    // call a function whenever the cursor moves:
    document.onmousemove = this.elementDrag.bind(this);
  }

  private elementDrag(mouseEvent: MouseEvent) {
    mouseEvent.preventDefault();
    // calculate the new cursor position:
    this.coords.mouseDeltaX = mouseEvent.clientX - this.coords.mouseStartX;
    this.coords.mouseDeltaY = mouseEvent.clientY - this.coords.mouseStartY;

    // set the element's new position:
    const deltaX = this.coords.mouseDeltaX + this.coords.elementX;
    const deltaY = this.coords.mouseDeltaY + this.coords.elementY;
    this.style.setProperty("--offsetX", deltaX + "px");
    this.style.setProperty("--offsetY", deltaY + "px");

    emit(this, {
      dragged: {
        deltaX,
        deltaY,
      },
    });
  }

  private closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;

    this.coords.elementX += this.coords.mouseDeltaX;
    this.coords.elementY += this.coords.mouseDeltaY;
    this.style.setProperty("--elementX", this.coords.elementX + "px");
    this.style.setProperty("--elementY", this.coords.elementY + "px");
  }
}

export function defineDragHandle() {
  customElements.define("drag-handle", DragHandle);
}
