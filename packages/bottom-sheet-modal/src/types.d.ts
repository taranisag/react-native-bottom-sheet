import type { BottomSheetContainerProps } from '@gorhom/bottom-sheet/src/components/bottomSheetContainer';

export type BottomSheetModalConfigs = {
  /**
   * Allow touch through overlay component.
   * @type boolean
   * @default false
   */
  allowTouchThroughOverlay?: boolean;
  /**
   * Overlay component.
   * @type (props: [BottomSheetOverlayProps](./components/overlay/types.d.ts)) => ReactNode
   * @default null
   */
  overlayComponent?: FC<BottomSheetOverlayProps>;
  /**
   * Overlay opacity.
   * @type number
   * @default 0.5
   */
  overlayOpacity?: number;
  /**
   * Dismiss modal when press on overlay.
   * @type boolean
   * @default true
   */
  dismissOnOverlayPress?: boolean;
  /**
   * Dismiss modal when scroll down.
   * @type boolean
   * @default true
   */
  dismissOnScrollDown?: boolean;
} & Omit<BottomSheetContainerProps, 'children'>;
