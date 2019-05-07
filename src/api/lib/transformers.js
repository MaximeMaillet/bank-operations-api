module.exports = {
  transform,
};

async function transform(data, _format) {
  if(Array.isArray(data)) {
    return Promise.all(data.map(async(item) => {
      return await transform(item, _format);
    }));
  }

  const format = require(`./transformers/${_format}.js`);
  const dataReturn = {};
  for(const i in format) {
    if(typeof format[i] === 'object') {
      let value = null;
      if(!format[i].type) {
        value = data[format[i].key] ? data[format[i].key] : format[i].default;
      } else {
        value = data[format[i].key] ? await transform(data[format[i].key], format[i].type) : format[i].default;
      }
      dataReturn[format[i].key] = value;
    } else {
      dataReturn[format[i]] = data[format[i]];
    }
  }

  return dataReturn;
}