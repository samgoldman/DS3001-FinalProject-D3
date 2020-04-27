//https://ranskills.wordpress.com/2018/10/15/shorten-amounts-to-thousands-k-millions-m-billions-b-and-trillions-t/

Formatter = {};
Formatter.THOUSAND = 'K';
Formatter.MILLION  = 'M';
Formatter.BILLION  = 'B';
Formatter.TRILLION = 'T';

Formatter.humanReadable = function(amount, dp=2,
								   preserveAmountUpToUnit = '', money=true) {
	const neg = amount < 0;
	amount = Math.abs(amount);

	const baseAmounts = {};
	let result = amount;
	let selectedUnit = '';

	if (isNaN(amount)) return amount;
	baseAmounts[this.TRILLION] = 1000 * 1000 * 1000 * 1000;
	baseAmounts[this.BILLION]  = 1000 * 1000 * 1000;
	baseAmounts[this.MILLION]  = 1000 * 1000;
	baseAmounts[this.THOUSAND] = 1000;


	for(let unit in baseAmounts) {
		const baseAmount = baseAmounts[unit];
		result = amount / baseAmount;
		if (result >= 1) {
			selectedUnit = unit;
			break;
		}
	}

	let returnValue;
	if (preserveAmountUpToUnit && selectedUnit &&
		baseAmounts[selectedUnit] <= baseAmounts[preserveAmountUpToUnit]) {
		returnValue = (neg ? '-' : '') + (money ? '$' : '') + amount.toFixed(dp);
	} else {
		if (selectedUnit === '') {
			returnValue = (neg ? '-' : '') + (money ? '$' : '') + amount.toFixed(dp);
		} else {
			returnValue = (neg ? '-' : '') + (money ? '$' : '') + result.toFixed(dp) + selectedUnit;
		}
	}

	return returnValue;
};
