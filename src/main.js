import "./style.css";
import html2canvas from "html2canvas";
import uniforms from "./uniforms";

const root = document.documentElement;

const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

class Player {
  constructor() {
    this.dom = this.cacheDom();
    this.settings = {};
    this.uniformsList = uniforms;

    this.init();
  }

  cacheDom() {
    return {
      players: qsa(".player"),
      playerLeft: qs(".player--left"),
      playerRight: qs(".player--right"),
      skin: qsa(".skin"),
      skinSwatchesList: qsa(".skin-group .swatch"),
      starBorder: qsa(".star__border"),
      starsList: qsa(".star-group .swatch"),
      nbr: qs('[name="nbr"]'),
      pos: qs('[name="pos"]'),
      name: qs('[name="name"]'),
      uniforms: qs('[name="uniforms"]'),
      infos: qs(".player__infos"),
      gearItemsList: qsa(".gear__item"),
      gearInputColorsList: qsa(".gear__item input"),
      handness: qs('select[name="handness"]'),
      color1: qs(".color-1"),
      color2: qs(".color-2"),
      color3: qs(".color-3"),
      downloadBtn: qs("#download-btn"),
      canvas: qs("#canvas"),
    };
  }

  init() {
    this.populateUniformsSelect();
    this.injectGearSwatches();
    this.bindEvents();

    // Default uniform (Habs - Home)
    this.populateOptions(this.uniformsList[15].list[0]);
    qs('[value="15-0"]', this.dom.uniforms).selected = true;
  }

  populateUniformsSelect() {
    let html = "";

    this.uniformsList.forEach((group, gIndex) => {
      html += `<optgroup label="${group.name}">`;

      group.list.forEach((uniform, uIndex) => {
        html += `<option value="${gIndex}-${uIndex}">${uniform.n}</option>`;
      });

      html += "</optgroup>";
    });

    this.dom.uniforms.innerHTML = html;
  }

  injectGearSwatches() {
    const html = `
      <div class="swatches">
        <button class="swatch c1" data-color="1"></button>
        <button class="swatch c2" data-color="2"></button>
        <button class="swatch c3" data-color="3"></button>
      </div>
    `;

    this.dom.gearItemsList.forEach((item) =>
      item.insertAdjacentHTML("beforeend", html),
    );

    this.dom.swatchesList = qsa(".gear .swatch");
  }

  bindEvents() {
    this.dom.uniforms.addEventListener("change", this.onUniformChange);
    this.dom.name.addEventListener("input", this.onNameInput);

    this.dom.skinSwatchesList.forEach((el) =>
      el.addEventListener("click", () => this.setSkin(el)),
    );

    this.dom.starsList.forEach((el) =>
      el.addEventListener("click", () => this.setStar(el)),
    );

    this.dom.handness.addEventListener("change", this.onHandnessChange);

    ["nbr", "pos"].forEach((k) =>
      this.dom[k].addEventListener("change", () => this.setInfos()),
    );

    [this.dom.color1, this.dom.color2, this.dom.color3].forEach((input, i) => {
      input.addEventListener("input", () => this.setMainColor(i, input.value));
    });

    this.dom.gearInputColorsList.forEach((el) =>
      el.addEventListener("input", () => this.updateOptions(el)),
    );

    this.dom.swatchesList.forEach((el) =>
      el.addEventListener("click", () => this.updateOptions(el)),
    );

    this.dom.downloadBtn.addEventListener("click", async () => {
      try {
        // Use html2canvas to render the element
        const canvas = await html2canvas(this.dom.canvas, {
          backgroundColor: "#c0e0f8",
          scale: window.devicePixelRatio,
          scrollX: 0,
          scrollY: 0,
          // scale: 2,
        });

        // Convert the canvas to a data URL
        const dataURL = canvas.toDataURL("image/png");
        const [team, jersey] = this.dom.uniforms.value.split("-").map(Number);
        const teamName = this.uniformsList[team].name.toLowerCase();

        // Create a temporary link to download the image
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `${teamName}-${this.dom.nbr.value}-nhl94.png`; // filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Error generating image:", err);
      }
    });
  }

  /* ---------- Handlers ---------- */

  onUniformChange = () => {
    const [team, jersey] = this.dom.uniforms.value.split("-").map(Number);
    this.populateOptions(this.uniformsList[team].list[jersey]);
  };

  onNameInput = () => {
    this.settings.n = this.dom.name.value;
  };

  onHandnessChange = () => {
    const isLefty = this.dom.handness.value === "l";
    this.dom.playerLeft.classList.toggle("is-lefty", isLefty);
    this.dom.playerRight.classList.toggle("is-lefty", isLefty);
  };

  /* ---------- Visual setters ---------- */
  setSkin(el) {
    this.toggleSelection(this.dom.skinSwatchesList, el);
    this.dom.skin.forEach(
      (s) => (s.style.fill = `var(--skin-${el.dataset.color})`),
    );
  }

  setStar(el) {
    this.toggleSelection(this.dom.starsList, el);
    this.dom.starBorder.forEach(
      (star) => (star.style.fill = `var(--star-${el.dataset.color})`),
    );
  }

  setInfos() {
    this.dom.infos.innerHTML = `${this.dom.nbr.value}&thinsp;${this.dom.pos.value}`;
  }

  setMainColor(index, value) {
    this.settings.m ??= [];
    this.settings.m[index] = value;
    root.style.setProperty(`--color-${index + 1}`, value);
  }

  /* ---------- Core logic ---------- */

  updateOptions(el) {
    const item = el.closest(".gear__item");
    const gearLeft = qs(`.${item.dataset.dom}`, this.dom.playerLeft);
    const gearRight = qs(`.${item.dataset.dom}`, this.dom.playerRight);
    const ref = item.dataset.ref;

    qsa(".is-selected", item).forEach((s) => s.classList.remove("is-selected"));

    el.classList.add("is-selected");

    if (el.classList.contains("swatch")) {
      const colorIndex = Number(el.dataset.color);
      this.settings[ref] = colorIndex;
      gearLeft.style.fill = `var(--color-${colorIndex})`;
      gearRight.style.fill = `var(--color-${colorIndex})`;
    } else {
      this.settings[ref] = el.value;
      root.style.setProperty(`--${item.dataset.var}`, el.value);
      gearLeft.style.fill = `var(--${item.dataset.var})`;
      gearRight.style.fill = `var(--${item.dataset.var})`;
    }
  }

  populateOptions(obj = {}) {
    Object.entries(obj).forEach(([key, value]) => {
      const item = qs(`[data-ref="${key}"]`);
      if (!item) return;

      if (Array.isArray(value)) {
        this.settings.m = [...value];
        value.forEach((c, i) => root.style.setProperty(`--color-${i + 1}`, c));
        qsa('[type="color"]', item).forEach(
          (input, i) => (input.value = value[i]),
        );
        return;
      }

      if (typeof value === "number") {
        const swatch = qs(`[data-color="${value}"]`, item);
        if (swatch) this.updateOptions(swatch);
        return;
      }

      if (typeof value === "string") {
        const input = qs('[type="color"]', item);
        if (input) {
          input.value = value;
          this.updateOptions(input);
        }
      }
    });
  }

  toggleSelection(list, active) {
    list.forEach((el) => el.classList.remove("is-selected"));
    active.classList.add("is-selected");
  }
}

new Player();
