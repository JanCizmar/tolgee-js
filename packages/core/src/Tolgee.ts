import { TolgeeConfig } from './TolgeeConfig';
import {
  InstantProps,
  TolgeeModule,
  TranslateProps,
  TranslationParams,
} from './types';

import { EventEmitterImpl } from './services/EventEmitter';
import { DependencyService } from './services/DependencyService';

export class Tolgee {
  private dependencyService: DependencyService;

  private constructor() {
    this.dependencyService = new DependencyService();
  }

  get properties() {
    return this.dependencyService.properties;
  }

  public get lang() {
    return this.properties.currentLanguage;
  }

  /**
   * This sets a new language.
   *
   * Using this setter can behave buggy when you change languages
   * too fast, since it changes the language property before
   * translations are actually loaded.
   * @deprecated use asynchronous changeLanguage method.
   */
  public set lang(newLanguage) {
    this.properties.currentLanguage = newLanguage;

    this.dependencyService.translationService
      .loadTranslations(newLanguage)
      .then(() => {
        this.emitLangChangeEvent(newLanguage);
      });
  }

  public get defaultLanguage() {
    return this.properties.config.defaultLanguage;
  }

  public get onLangChange() {
    return this.dependencyService.eventService.LANGUAGE_CHANGED;
  }

  public get onTranslationChange() {
    return this.dependencyService.eventService.TRANSLATION_CHANGED;
  }

  /**
   * Is emitted when language translations are loaded for the first time.
   * It is not emitted when language is changed and translations were loaded before.
   */
  public get onLangLoaded() {
    return this.dependencyService.eventService.LANGUAGE_LOADED;
  }

  /**
   * True if loading is needed to wait for Tolgee init.
   * When translation data are provided statically (using import
   * as staticData config property) then there is no need for translation
   * fetching so initial loading is not needed at all.
   */
  get initialLoading(): boolean {
    if (this.properties?.config?.mode !== 'production') {
      return true;
    }

    const currentLang = this.properties.currentLanguage;
    const fallbackLang = this.properties.config.fallbackLanguage;
    const fallbackPreloading = this.properties.config.preloadFallback;
    const isStaticDataProvided = (data?: any) => {
      return data !== undefined && typeof data !== 'function';
    };

    return (
      !isStaticDataProvided(this.properties.config.staticData?.[currentLang]) ||
      (!!fallbackPreloading &&
        !isStaticDataProvided(
          this.properties.config.staticData?.[fallbackLang]
        ))
    );
  }

  private get coreService() {
    return this.dependencyService.coreService;
  }

  static use(module: TolgeeModule) {
    return new Tolgee().use(module);
  }

  static init(config: TolgeeConfig) {
    return new Tolgee().init(config);
  }

  /**
   * Sets the new language.
   *
   * Emits the onLangChange and onLangChangeAndLoad events after
   * the translations are loaded.
   *
   * @return Promise<void> Resolves when translations are loaded
   */
  public async changeLanguage(newLanguage: string): Promise<void> {
    await this.dependencyService.translationService.loadTranslations(
      newLanguage
    );
    this.properties.currentLanguage = newLanguage;
    this.emitLangChangeEvent(newLanguage);
  }

  use(module: TolgeeModule) {
    this.dependencyService.moduleService.addModule(module);
    return this;
  }

  init(config: TolgeeConfig) {
    this.dependencyService.init(config);
    return this;
  }

  public async run(): Promise<void> {
    this.dependencyService.run();
    if (this.properties.config.mode === 'development') {
      await this.coreService.loadApiKeyDetails();
    }

    await this.dependencyService.translationService.loadTranslations();
    await this.dependencyService.pluginManager.run();

    if (this.properties.config.preloadFallback) {
      await this.dependencyService.translationService.loadTranslations(
        this.properties.config.fallbackLanguage
      );
    }

    await this.refresh();

    if (this.properties.config.watch) {
      this.dependencyService.observer.observe();
    }
  }

  public async refresh() {
    return this.dependencyService.wrapper.handleSubtree(
      this.properties.config.targetElement
    );
  }

  async translate(props: TranslateProps): Promise<string>;

  async translate(
    key: string,
    params?: TranslationParams,
    noWrap?: boolean,
    defaultValue?: string
  ): Promise<string>;

  async translate(
    keyOrProps: string | TranslateProps,
    params: TranslationParams = {},
    noWrap = false,
    defaultValue: string | undefined = undefined
  ): Promise<string> {
    const key = typeof keyOrProps === 'string' ? keyOrProps : keyOrProps.key;
    let orEmpty = undefined;
    if (typeof keyOrProps === 'object') {
      const props = keyOrProps as TranslateProps;
      // if values are not provided in props object, get them from function
      // params defaults
      params = props.params !== undefined ? props.params : params;
      noWrap = props.noWrap !== undefined ? props.noWrap : noWrap;
      defaultValue =
        props.defaultValue !== undefined ? props.defaultValue : defaultValue;
      orEmpty = props.orEmpty;
    }

    const translation = await this.dependencyService.textService.translate(
      key,
      params,
      undefined,
      orEmpty,
      defaultValue
    );

    if (this.properties.config.mode === 'development' && !noWrap) {
      await this.coreService.loadApiKeyDetails();
      return this.dependencyService.wrapper.wrap(
        key,
        params,
        defaultValue,
        translation
      );
    }

    return translation;
  }

  wrap(
    key: string,
    params?: TranslationParams,
    defaultValue?: string | undefined,
    translation?: string
  ): string {
    if (this.properties.config.mode === 'development') {
      return this.dependencyService.wrapper.wrap(
        key,
        params,
        defaultValue,
        translation
      );
    } else {
      return translation || defaultValue;
    }
  }

  instant(
    key: string,
    params?: TranslationParams,
    noWrap?: boolean,
    orEmpty?: boolean,
    defaultValue?: string
  ): string;

  instant(props: InstantProps): string;

  instant(
    keyOrProps: string | InstantProps,
    params: TranslationParams = {},
    noWrap = false,
    orEmpty?: boolean,
    defaultValue?: string
  ): string {
    const key = typeof keyOrProps === 'string' ? keyOrProps : keyOrProps.key;
    if (typeof keyOrProps === 'object') {
      const props = keyOrProps as InstantProps;
      // if values are not provided in props object, get them from function
      // params defaults
      params = props.params !== undefined ? props.params : params;
      noWrap = props.noWrap !== undefined ? props.noWrap : noWrap;
      defaultValue =
        props.defaultValue !== undefined ? props.defaultValue : defaultValue;
      orEmpty = props.orEmpty !== undefined ? props.orEmpty : orEmpty;
    }

    const translation = this.dependencyService.textService.instant(
      key,
      params,
      undefined,
      orEmpty,
      defaultValue
    );

    if (this.properties.config.mode === 'development' && !noWrap) {
      return this.dependencyService.wrapper.wrap(
        key,
        params,
        defaultValue,
        translation
      );
    }
    return translation;
  }

  /**
   * Get currently cached translations for all languages
   */
  public getCachedTranslations() {
    return this.dependencyService.translationService.getCachedTranslations();
  }

  /**
   * Loads translations for given language or returns them from cache
   * @returns Loaded translations
   */
  public loadTranslations(lang: string) {
    return this.dependencyService.translationService.loadTranslations(lang);
  }

  public stop = () => {
    this.dependencyService.stop();
  };

  private emitLangChangeEvent(value: string) {
    const langChangedEmitter = this.onLangChange as EventEmitterImpl<any>;
    langChangedEmitter.emit(value);
  }
}
