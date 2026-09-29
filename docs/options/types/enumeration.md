---
"#type": concept
title: enumeration type
summary: Option value restricted to a predefined list of choices, listed as the option's type modifiers.
keywords:
  - enumeration
  - enum
  - list
  - choice
---
A value that must be one of a predefined list of choices.

## Syntax

The value must be one of the choices declared for the option. Unlike other types, the allowed values are not references to modifier files: the type modifiers *are* the list of accepted choices. Passing any other value fails validation.

## Example

The [`browser`](../browser.md) option accepts `chrome`, `chromium`, `firefox`, `webkit`, `edge` or `safari` (`--browser firefox`), and the [`driver`](../driver.md) option accepts `puppeteer`, `playwright`, `webdriverio` or `selenium-webdriver`.
