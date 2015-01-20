
function Overdraft(remainder, debit) {
  Error.captureStackTrace(this, Overdraft);

  this.debit = debit;
  this.remainder = remainder;
}

// Inherit from Error //
Overdraft.prototype = Object.create(Error.prototype);
Overdraft.prototype.constructor = Overdraft;

module.exports = Overdraft;
