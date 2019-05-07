module.exports = [
  'id',
  'label',
  {key: 'debit', default: 0},
  {key: 'credit', default: 0},
  'category',
  'date',
  'tags',
  {key: 'subs', type: 'SubOperation', default: []},
];