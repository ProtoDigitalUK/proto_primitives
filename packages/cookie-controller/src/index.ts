import { v4 as uuidv4 } from "uuid";

const attributes = {
  details: "data-cookie-details",
  alert: "data-cookie-alert",
  cookieConfig: "data-cookie-config",

  action: {
    attribute: "data-cookie-action",
    value: {
      dismiss: "dismiss",
      accept: "accept",
      reject: "reject",
      details: "details",
      save: "save",
    },
  },
};
const ids = {
  details: "cookie-details",
  alert: "cookie-alert",
};

const cookieController = "CookieController";

export default class CookieController {
  userOptions: CookieControllerOptionsT = {};
  state: CookieStateT = {
    uuid: "",
    interacted: false,
    cookies: {},
  };

  constructor(options?: CookieControllerOptionsT) {
    if (options) this.userOptions = options;
    this.initalise();
  }

  // ----------------
  // Private methods
  private initalise() {
    this.state = this.cookieState;
    this.registerEvents();
    this.setStaticAttributes();
    this.setDynamicAttributes();

    if (!this.state.interacted) {
      this.alertState = true;
    }

    if (this.state.version && this.options.versioning?.current) {
      if (this.state.version !== this.options.versioning.current) {
        if (this.options.versioning.onNewVersion) {
          this.options.versioning.onNewVersion(
            this.state.version,
            this.options.versioning.current
          );
        }
      }
      this.state.version = this.options.versioning.current;
      this.cookieState = this.state;
    }
  }
  private registerEvents() {
    this.accept = this.accept.bind(this);
    this.dismiss = this.dismiss.bind(this);
    this.reject = this.reject.bind(this);
    this.showDetails = this.showDetails.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onCookieChange = this.onCookieChange.bind(this);

    this.actionDismiss.forEach((element) =>
      element.addEventListener("click", this.dismiss)
    );
    this.actionAccept.forEach((element) =>
      element.addEventListener("click", this.accept)
    );
    this.actionReject.forEach((element) =>
      element.addEventListener("click", this.reject)
    );
    this.actionDetails.forEach((element) =>
      element.addEventListener("click", this.showDetails)
    );
    this.actionSave.forEach((element) =>
      element.addEventListener("click", this.onSave)
    );
    this.cookieConfig.forEach((element) => {
      element.addEventListener("change", this.onCookieChange);
    });
  }
  private setDynamicAttributes() {
    const detailsState = this.detailsState;

    this.details?.setAttribute("aria-hidden", detailsState ? "false" : "true");
    this.alert?.setAttribute("aria-hidden", detailsState ? "true" : "false");

    this.actionDetails.forEach((element) => {
      element.setAttribute("aria-expanded", detailsState ? "true" : "false");
    });
  }
  private setStaticAttributes() {
    if (!this.details?.hasAttribute("id"))
      this.details?.setAttribute("id", ids.details);
    if (!this.alert?.hasAttribute("id"))
      this.alert?.setAttribute("id", ids.alert);

    const detailId = this.details?.getAttribute("id") as string;
    // const alertId = this.alert?.getAttribute("id") as string;

    this.details?.setAttribute("role", "dialog");
    this.details?.setAttribute("aria-modal", "true");

    this.alert?.setAttribute("aria-live", "polite");
    this.alert?.setAttribute("role", "alert");

    this.actionDetails.forEach((element) => {
      element.setAttribute("aria-controls", detailId);
      element.setAttribute("aria-haspopup", "dialog");
    });
  }
  private getCookie(key: string) {
    const cookie = document.cookie
      .split(";")
      .find((cookie) => cookie.trim().startsWith(`${key}=`));

    if (cookie) {
      const cookieValue = cookie.split("=")[1];
      return cookieValue;
    }
  }
  private onCookieChange(e: Event) {
    if (this.options.mode !== "onChange") return;

    const target = e.target as HTMLInputElement;

    const key = target.getAttribute(attributes.cookieConfig) as string;
    if (!key) return;

    const value = target.checked;

    this.state.cookies[key] = value;
    this.cookieState = this.state;

    if (this.options.onConsentChange) {
      this.options.onConsentChange({
        type: "cookie",
        uuid: this.state.uuid,
        cookie: {
          key,
          value,
        },
        cookies: this.state.cookies,
      });
    }
  }

  // ----------------
  // Public methods
  destroy() {
    this.actionDismiss.forEach((element) =>
      element.removeEventListener("click", this.dismiss)
    );
    this.actionAccept.forEach((element) =>
      element.removeEventListener("click", this.accept)
    );
    this.actionReject.forEach((element) =>
      element.removeEventListener("click", this.reject)
    );
    this.actionDetails.forEach((element) =>
      element.removeEventListener("click", this.showDetails)
    );
    this.actionSave.forEach((element) =>
      element.removeEventListener("click", this.onSave)
    );
    this.cookieConfig.forEach((element) => {
      element.removeEventListener("change", this.onCookieChange);
    });
  }
  accept() {
    this.rejectAccept("accept");
  }
  reject() {
    this.rejectAccept("reject");
  }
  rejectAccept(mode: "accept" | "reject" = "accept") {
    this.cookieConfig.forEach((element) => {
      const key = element.getAttribute(attributes.cookieConfig) as string;
      this.state.cookies[key] = mode === "accept" ? true : false;
    });

    if (this.options.onConsentChange) {
      this.options.onConsentChange({
        type: mode,
        uuid: this.state.uuid,
        cookies: this.state.cookies,
      });
    }

    this.dismiss();
  }
  dismiss() {
    this.detailsState = false;
    this.alertState = false;

    this.state.interacted = true;
    this.cookieState = this.state;
  }
  showDetails() {
    this.cookieConfig.forEach((element) => {
      const key = element.getAttribute(attributes.cookieConfig) as string;
      const value = this.state.cookies[key];
      element.checked = value ? true : false;
    });

    this.detailsState = !this.detailsState;
    this.state.interacted = true;
    this.cookieState = this.state;
  }
  onSave() {
    this.cookieConfig.forEach((element) => {
      const key = element.getAttribute(attributes.cookieConfig) as string;
      const value = element.checked;
      this.state.cookies[key] = value;
    });

    if (this.options.onConsentChange) {
      this.options.onConsentChange({
        type: "save",
        uuid: this.state.uuid,
        cookies: this.state.cookies,
      });
    }

    this.dismiss();
  }

  // ----------------
  // Error handling
  throwError(message: string) {
    throw new Error(`[CookieController] ${message}`);
  }

  // ----------------
  // Setters
  set alertState(state: boolean) {
    this.alert?.setAttribute("data-cookie-alert", state ? "true" : "false");
    this.setDynamicAttributes();
  }
  set detailsState(state: boolean) {
    if (this.alertState) this.alertState = false;
    this.details?.setAttribute("data-cookie-details", state ? "true" : "false");
    this.setDynamicAttributes();
  }
  set cookieState(state: CookieStateT) {
    if (!state.uuid) state.uuid = uuidv4();

    const cookieValue = JSON.stringify(state);
    document.cookie = `${cookieController}=${cookieValue};path=/;SameSite=Strict`;

    this.state = state;
  }

  // ----------------
  // getters
  get options() {
    return {
      mode: this.actionSave.length > 0 ? "onSave" : "onChange",
      onConsentChange: this.userOptions.onConsentChange || null,
      versioning: this.userOptions.versioning || null,
    };
  }
  // State
  get alertState() {
    return this.alert?.getAttribute("data-cookie-alert") == "true"
      ? true
      : false;
  }
  get detailsState() {
    return this.details?.getAttribute("data-cookie-details") == "true"
      ? true
      : false;
  }
  get cookieState() {
    const defaultCookies: Record<string, boolean> = {};
    this.cookieConfig.forEach((element) => {
      const key = element.getAttribute(attributes.cookieConfig) as string;
      defaultCookies[key] = false;
    });

    try {
      const value = this.getCookie(cookieController);
      if (value) {
        return JSON.parse(value) as CookieStateT;
      }
      return {
        uuid: "",
        version: this.options.versioning?.current || undefined,
        interacted: false,
        cookies: defaultCookies,
      };
    } catch (error) {
      return {
        uuid: "",
        version: this.options.versioning?.current || undefined,
        interacted: false,
        cookies: defaultCookies,
      };
    }
  }
  // Elements
  get details() {
    return document.querySelector(`[${attributes.details}]`);
  }
  get alert() {
    return document.querySelector(`[${attributes.alert}]`);
  }
  get cookieConfig() {
    const eles = document.querySelectorAll(
      `[${attributes.cookieConfig}]`
    ) as NodeListOf<HTMLElement>;
    return Array.from(eles).filter(
      (ele) => ele.getAttribute("type") === "checkbox"
    ) as HTMLInputElement[];
  }
  get actionDismiss() {
    return document.querySelectorAll(
      `[${attributes.action.attribute}="${attributes.action.value.dismiss}"]`
    );
  }
  get actionAccept() {
    return document.querySelectorAll(
      `[${attributes.action.attribute}="${attributes.action.value.accept}"]`
    );
  }
  get actionReject() {
    return document.querySelectorAll(
      `[${attributes.action.attribute}="${attributes.action.value.reject}"]`
    );
  }
  get actionDetails() {
    return document.querySelectorAll(
      `[${attributes.action.attribute}="${attributes.action.value.details}"]`
    );
  }
  get actionSave() {
    return document.querySelectorAll(
      `[${attributes.action.attribute}="${attributes.action.value.save}"]`
    );
  }
}

// ----------------
// Types

interface CookieControllerOptionsT {
  onConsentChange?: (data: ConsentChangeT) => void;
  versioning?: {
    current: string;
    onNewVersion?: (oldVersion: string, newVersion: string) => void;
  };
}
interface ConsentChangeT {
  type: "cookie" | "accept" | "reject" | "save";
  uuid: string;

  cookie?: {
    key: string;
    value: boolean;
  };
  cookies: Record<string, boolean>;
}

interface CookieStateT {
  uuid: string;
  version?: string;
  interacted: boolean;
  cookies: Record<string, boolean>;
}
