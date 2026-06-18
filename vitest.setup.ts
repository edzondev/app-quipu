import "@testing-library/dom";

// Required by React 18+ testing-library to use `act()` correctly
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT =
  true;
