/**
 * DOM and Code Inspector for index.html and personal_brand_v4.html
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function getHtmlContent(fileName = 'index.html') {
  const rootDir = path.resolve(__dirname, '../../..');
  const filePath = path.join(rootDir, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function extractHardwareCatalog(htmlContent = null) {
  const content = htmlContent || getHtmlContent('index.html');
  const match = content.match(/const\s+HARDWARE_CATALOG\s*=\s*(\{[\s\S]*?\n\s*\});/);
  if (!match) {
    throw new Error('Could not find const HARDWARE_CATALOG in HTML');
  }
  const code = `const HARDWARE_CATALOG = ${match[1]}; HARDWARE_CATALOG;`;
  const context = vm.createContext({});
  return vm.runInContext(code, context);
}

function extractSneakersCatalog(htmlContent = null) {
  const content = htmlContent || getHtmlContent('index.html');
  const match = content.match(/const\s+SNEAKERS\s*=\s*(\[[\s\S]*?\n\s*\]);/);
  if (!match) {
    throw new Error('Could not find const SNEAKERS in HTML');
  }
  const code = `const SNEAKERS = ${match[1]}; SNEAKERS;`;
  const context = vm.createContext({});
  return vm.runInContext(code, context);
}

function findElementById(id, htmlContent = null) {
  const content = htmlContent || getHtmlContent('index.html');
  const regex = new RegExp(`<([a-zA-Z0-9\\-]+)[^>]*id=["']${id}["'][^>]*>`, 'i');
  const match = content.match(regex);
  if (!match) return null;
  return {
    raw: match[0],
    tag: match[1],
    hasAttr: (attr) => new RegExp(`${attr}(?:=["'][^"']*["'])?`, 'i').test(match[0]),
    getAttr: (attr) => {
      const m = match[0].match(new RegExp(`${attr}=["']([^"']*)["']`, 'i'));
      return m ? m[1] : null;
    }
  };
}

function findElementsByClass(className, htmlContent = null) {
  const content = htmlContent || getHtmlContent('index.html');
  const regex = new RegExp(`<([a-zA-Z0-9\\-]+)[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, 'gi');
  const matches = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    matches.push({
      raw: m[0],
      tag: m[1]
    });
  }
  return matches;
}

function hasCssRule(selector, property = null, htmlContent = null) {
  const content = htmlContent || getHtmlContent('index.html');
  // Look in <style> blocks
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ruleRegex = new RegExp(`${escapedSelector}\\s*\\{([^\\}]*)\\}`, 'gi');
  let match;
  while ((match = ruleRegex.exec(content)) !== null) {
    if (!property) return true;
    const body = match[1];
    if (new RegExp(`${property}\\s*:`, 'i').test(body)) {
      return true;
    }
  }
  return false;
}

module.exports = {
  getHtmlContent,
  extractHardwareCatalog,
  extractSneakersCatalog,
  findElementById,
  findElementsByClass,
  hasCssRule
};
