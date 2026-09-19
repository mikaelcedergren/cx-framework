# Image delivery

`image` describes both the image and its display. Existing `width`, `height`, `maxWidth`, and
`maxHeight` select framework sizes. `intrinsicWidth` and `intrinsicHeight` instead describe the
source in positive integer pixels and set the native width/height attributes to reserve its ratio.

Use `image.loading: 'lazy'` for below-the-fold images. Keep hero images eager (the default),
using `fetchPriority: 'high'` for the principal visual. `fetchPriority` otherwise defaults to
`auto`; `low` is also supported. Native lazy loading and priority remain browser hints.
The component's boolean `loading` input still shows a spinner; it does not defer fetching.

`srcset` and `sizes` accept native strings and are omitted when empty. Supply real variants of
the same artwork and an accurate sizes expression for the product layout. For example:

```ts
const illustration: CxImage = {
  src: "/images/room-1200.jpg",
  srcset: "/images/room-600.jpg 600w, /images/room-1200.jpg 1200w",
  sizes: "(max-width: 719px) 100vw, 50vw",
  alt: "A room measurement recorded beside its window.",
  intrinsicWidth: 1200,
  intrinsicHeight: 800,
  loading: "lazy",
};
```

Supplying an image without delivery fields retains eager, automatic-priority loading. Clearing
optional responsive fields removes their attributes. Invalid pixel dimensions throw rather than
silently replacing the supplied value. Load failure and missing source use the existing fallback.
