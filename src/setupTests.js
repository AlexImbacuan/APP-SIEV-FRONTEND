// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// react-router v7 usa TextEncoder, que el jsdom de Jest 27 (CRA 5) no incluye
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
