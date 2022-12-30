import {execSync} from 'child_process';
import {config} from './config.mjs';
import * as cheerio from 'cheerio';

function renderD2(diagram) {
  const output = execSync(`d2 - -`, {
    input: diagram,
    encoding: 'utf8',
    env: {
      D2_PAD: config.d2.padding,
      D2_SKETCH: config.d2.sketchy,
      D2_THEME: config.d2.theme,
    }
  });

  if (config.d2.transparentBackground) {
    const $ = cheerio.load(output, null, false);
    $('svg').removeAttr('style');
    return $.html();
  }

  return output;
}

export function transformD2($) {
  $(`${config.postContentSelector} ${config.d2.selector}`).each((i, el) => {
    const $el = $(el);
    const diagram = $el.text();
    console.log("rendering d2 diagram...");
    const svg = renderD2(diagram);
    $el.replaceWith(svg);
  });
}
