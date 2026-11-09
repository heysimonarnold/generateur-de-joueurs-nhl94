import "./style.css";
import html2canvas from "html2canvas";
import uniforms from "./uniforms.json";

type UniformEntry = {
  m: string[];
  n: string;
  [key: string]: string | number | string[] | undefined;
};

type UniformGroup = {
  name: string;
  list: UniformEntry[];
};

type SettingValue = string | number | string[] | undefined;
type PlayerSettings = Record<string, SettingValue>;

const root = document.documentElement;

const qs = <T extends Element>(
  sel: string,
  ctx: ParentNode = document,
): T | null => ctx.querySelector(sel) as T | null;

const qsa = <T extends Element>(sel: string, ctx: ParentNode = document): T[] =>
  Array.from(ctx.querySelectorAll(sel)) as T[];

class Player {
  dom: {
    players: Element[];
    playerLeft: SVGSVGElement;
    playerRight: SVGSVGElement;
    skin: SVGPathElement[];
    skinSwatchesList: HTMLElement[];
    starBorder: SVGPathElement[];
    starsList: HTMLElement[];
    nbr: HTMLInputElement;
    pos: HTMLInputElement;
    name: HTMLInputElement;
    uniforms: HTMLSelectElement;
    infos: HTMLElement;
    gearItemsList: HTMLElement[];
    gearInputColorsList: HTMLInputElement[];
    handness: HTMLSelectElement;
    color1: HTMLInputElement;
    color2: HTMLInputElement;
    color3: HTMLInputElement;
    downloadBtn: HTMLButtonElement;
    canvas: HTMLElement;
    swatchesList: HTMLElement[];
  };
  settings: PlayerSettings;
  uniformsList: UniformGroup[];

  constructor() {
    this.dom = this.cacheDom();
    this.settings = {};
    this.uniformsList = uniforms as UniformGroup[];

    this.init();
  }

  cacheDom() {
    return {
      players: qsa<Element>(".player"),
      playerLeft: qs<SVGSVGElement>(".player--left") as SVGSVGElement,
      playerRight: qs<SVGSVGElement>(".player--right") as SVGSVGElement,
      skin: qsa<SVGPathElement>(".skin"),
      skinSwatchesList: qsa<HTMLElement>(".skin-group .swatch"),
      starBorder: qsa<SVGPathElement>(".star__border"),
      starsList: qsa<HTMLElement>(".star-group .swatch"),
      nbr: qs<HTMLInputElement>('[name="nbr"]') as HTMLInputElement,
      pos: qs<HTMLInputElement>('[name="pos"]') as HTMLInputElement,
      name: qs<HTMLInputElement>('[name="name"]') as HTMLInputElement,
      uniforms: qs<HTMLSelectElement>('[name="uniforms"]') as HTMLSelectElement,
      infos: qs<HTMLElement>(".player__infos") as HTMLElement,
      gearItemsList: qsa<HTMLElement>(".gear__item"),
      gearInputColorsList: qsa<HTMLInputElement>(".gear__item input"),
      handness: qs<HTMLSelectElement>(
        'select[name="handness"]',
      ) as HTMLSelectElement,
      color1: qs<HTMLInputElement>(".color-1") as HTMLInputElement,
      color2: qs<HTMLInputElement>(".color-2") as HTMLInputElement,
      color3: qs<HTMLInputElement>(".color-3") as HTMLInputElement,
      downloadBtn: qs<HTMLButtonElement>("#download-btn") as HTMLButtonElement,
      canvas: qs<HTMLElement>("#canvas") as HTMLElement,
      swatchesList: qsa<HTMLElement>(".gear .swatch"),
    };
  }

  init() {
    this.populateUniformsSelect();
    this.injectGearSwatches();
    this.bindEvents();

    const defaultUniform = this.uniformsList[15]?.list[0];
    if (defaultUniform) {
      this.populateOptions(defaultUniform);
    }

    const defaultOption = qs<HTMLOptionElement>(
      '[value="15-0"]',
      this.dom.uniforms,
    );
    if (defaultOption) {
      defaultOption.selected = true;
    }
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

    this.dom.swatchesList = qsa<HTMLElement>(".gear .swatch");
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

    (["nbr", "pos"] as const).forEach((key) => {
      this.dom[key].addEventListener("change", () => this.setInfos());
    });

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
        const canvas = await html2canvas(this.dom.canvas, {
          backgroundColor: "#c0e0f8",
          scale: window.devicePixelRatio,
          scrollX: 0,
          scrollY: 0,
        });

        const dataURL = canvas.toDataURL("image/png");
        const [team, jersey] = this.dom.uniforms.value.split("-").map(Number);
        const uniformGroup = this.uniformsList[team];

        if (!uniformGroup) {
          return;
        }

        const teamName = uniformGroup.name.toLowerCase();

        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `${teamName}-${this.dom.nbr.value}-nhl94.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Error generating image:", err);
      }
    });
  }

  onUniformChange = () => {
    const [team, jersey] = this.dom.uniforms.value.split("-").map(Number);
    const uniformGroup = this.uniformsList[team];

    if (!uniformGroup) {
      return;
    }

    const uniform = uniformGroup.list[jersey];
    if (uniform) {
      this.populateOptions(uniform);
    }
  };

  onNameInput = () => {
    this.settings.n = this.dom.name.value;
  };

  onHandnessChange = () => {
    const isLefty = this.dom.handness.value === "l";
    this.dom.playerLeft.classList.toggle("is-lefty", isLefty);
    this.dom.playerRight.classList.toggle("is-lefty", isLefty);
  };

  setSkin(el: HTMLElement) {
    this.toggleSelection(this.dom.skinSwatchesList, el);
    this.dom.skin.forEach(
      (s) => (s.style.fill = `var(--skin-${el.dataset.color})`),
    );
  }

  setStar(el: HTMLElement) {
    this.toggleSelection(this.dom.starsList, el);
    this.dom.starBorder.forEach(
      (star) => (star.style.fill = `var(--star-${el.dataset.color})`),
    );
  }

  setInfos() {
    this.dom.infos.innerHTML = `${this.dom.nbr.value}&thinsp;${this.dom.pos.value}`;
  }

  setMainColor(index: number, value: string) {
    const palette = (this.settings.m ??= []) as string[];
    palette[index] = value;
    root.style.setProperty(`--color-${index + 1}`, value);
  }

  updateOptions(el: Element) {
    const item = el.closest<HTMLElement>(".gear__item");
    if (!item) return;

    const gearDom = item.dataset.dom;
    const ref = item.dataset.ref;

    if (!gearDom || !ref) return;

    const gearLeft = qs<SVGElement>(`.${gearDom}`, this.dom.playerLeft);
    const gearRight = qs<SVGElement>(`.${gearDom}`, this.dom.playerRight);

    if (!gearLeft || !gearRight) return;

    qsa<HTMLElement>(".is-selected", item).forEach((s) =>
      s.classList.remove("is-selected"),
    );

    el.classList.add("is-selected");

    if (el.classList.contains("swatch")) {
      const colorIndex = Number((el as HTMLElement).dataset.color);
      this.settings[ref] = colorIndex;
      gearLeft.style.fill = `var(--color-${colorIndex})`;
      gearRight.style.fill = `var(--color-${colorIndex})`;
    } else {
      const value = (el as HTMLInputElement).value;
      this.settings[ref] = value;
      root.style.setProperty(`--${item.dataset.var}`, value);
      gearLeft.style.fill = `var(--${item.dataset.var})`;
      gearRight.style.fill = `var(--${item.dataset.var})`;
    }
  }

  populateOptions(obj: Record<string, unknown> = {}) {
    Object.entries(obj).forEach(([key, value]) => {
      const item = qs<HTMLElement>(`[data-ref="${key}"]`);
      if (!item) return;

      if (Array.isArray(value)) {
        this.settings.m = [...value];
        value.forEach((color, i) =>
          root.style.setProperty(`--color-${i + 1}`, String(color)),
        );
        qsa<HTMLInputElement>('[type="color"]', item).forEach((input, i) => {
          input.value = String(value[i] ?? "#000000");
        });
        return;
      }

      if (typeof value === "number") {
        const swatch = qs<HTMLElement>(`[data-color="${value}"]`, item);
        if (swatch) this.updateOptions(swatch);
        return;
      }

      if (typeof value === "string") {
        const input = qs<HTMLInputElement>('[type="color"]', item);
        if (input) {
          input.value = value;
          this.updateOptions(input);
        }
      }
    });
  }

  toggleSelection(list: HTMLElement[], active: Element) {
    list.forEach((el) => el.classList.remove("is-selected"));
    active.classList.add("is-selected");
  }
}

new Player();
