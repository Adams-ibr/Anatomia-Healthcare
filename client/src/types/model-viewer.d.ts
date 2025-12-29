declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'shadow-intensity'?: string;
        exposure?: string;
        'environment-image'?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'camera-orbit'?: string;
        'field-of-view'?: string;
        'min-camera-orbit'?: string;
        'max-camera-orbit'?: string;
        'min-field-of-view'?: string;
        'max-field-of-view'?: string;
        'interaction-prompt'?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        reveal?: 'auto' | 'manual';
        'animation-name'?: string;
        'animation-crossfade-duration'?: string;
      },
      HTMLElement
    >;
  }
}
