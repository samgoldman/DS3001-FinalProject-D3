const PLOT_WIDTH = 600;
const PLOT_HEIGHT = 400;

Date.prototype.isLeapYear = function() {
	const year = this.getFullYear();
	if((year & 3) !== 0) return false;
	return ((year % 100) !== 0 || (year % 400) === 0);
};

// Get Day of Year
Date.prototype.getDOY = function() {
	const dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
	const mn = this.getMonth();
	const dn = this.getDate();
	let dayOfYear = dayCount[mn] + dn;
	if(mn > 1 && this.isLeapYear()) dayOfYear++;
	return dayOfYear;
};

const plot_title = (elem, title) => {
	elem.append('text')
		.attr('font-size', '16px')
		.attr('font-family', 'sans-serif')
		.attr('dominant-baseline', 'hanging')
		.attr('text-anchor', 'middle')
		.attr('x', PLOT_WIDTH/2)
		.attr('y', 25)
		.text(title);
};

// Source: https://bl.ocks.org/gordlea/27370d1eea8464b04538e6d8ced39e89
const plot_data = (group, x_data, y_data, position_confirmations) => {
	// Remove NaNs from rolling average
	x_data = x_data.slice(11);
	y_data = y_data.slice(11);

	const x_scale = d3.scaleLinear()
		.domain([x_data[0], x_data[x_data.length - 1]])
		.range([50, PLOT_WIDTH - 50]);

	const y_scale = d3.scaleLinear()
		.domain([Math.min(...y_data), Math.max(...y_data)])
		.range([PLOT_HEIGHT - 20, 50]);

	const line = d3.line()
		.x(d => x_scale(d[0]))
		.y(d => y_scale(d[1]))
		.curve(d3.curveMonotoneX)

	// Zip x and y
	const dataset = x_data.map((e, i) => [e, y_data[i]]);

	position_confirmations = position_confirmations.filter(d => convert_to_relative_year(d['Confirmed']) >= x_data[0])

	group.selectAll('.conf_line')
		.data(position_confirmations)
		.enter()
		.append('line')
		.attr('class', d => `conf_line ${d['Party'].toLowerCase()}`)
		.attr('y1', 50)
		.attr('y2', PLOT_HEIGHT - 20)
		.attr('x1', d => x_scale(convert_to_relative_year(d['Confirmed'])))
		.attr('x2', d => x_scale(convert_to_relative_year(d['Confirmed'])))
		.style('stroke-width', '2px');

	group.append('path')
		.datum(dataset)
		.attr('class', 'line')
		.attr('d', line);

	group.append("g")
		.attr("class", "x_axis")
		.attr("transform", `translate(0,${PLOT_HEIGHT-20})`)
		.call(d3.axisBottom(x_scale)
			.tickFormat(d => d)); // Create an axis component with d3.axisBottom

	group.append("g")
		.attr("class", "y_axis")
		.attr("transform", `translate(50,0)`)
		.call(d3.axisLeft(y_scale)
			.tickFormat(d => Formatter.humanReadable(d, 1, '', true))); // Create an axis component with d3.axisLeft


};

const plot_percent_data = (group, x_data, y_data) => {
	// Remove NaNs from rolling average
	x_data = x_data.slice(11);
	y_data = y_data.slice(11);

	const x_scale = d3.scaleLinear()
		.domain([x_data[0], x_data[x_data.length - 1]])
		.range([50, PLOT_WIDTH - 50]);

	const y_scale = d3.scaleLinear()
		.domain([Math.min(...y_data), Math.max(...y_data)])
		.range([PLOT_HEIGHT - 20, 50]);

	const line = d3.line()
		.x(d => x_scale(d[0]))
		.y(d => y_scale(d[1]))
		.curve(d3.curveMonotoneX)

	// Zip x and y
	const dataset = x_data.map((e, i) => [e, y_data[i]]);

	group.append('path')
		.datum(dataset)
		.attr('class', 'line line_percent')
		.attr('d', line);

	group.append("g")
		.attr("class", "y_axis")
		.attr("transform", `translate(${PLOT_WIDTH - 50},0)`)
		.call(d3.axisRight(y_scale)
			.tickFormat(d => (d*100.0).toFixed(2) + '%')); // Create an axis component with d3.axisLeft


};

const plot_position = (svg, y_offset, position_data, position_confirmations) => {
	const domestic_group = svg.append('g').attr('transform', `translate(0, ${y_offset})`);
	const foreign_group = svg.append('g').attr('transform', `translate(${PLOT_WIDTH}, ${y_offset})`);

	plot_title(domestic_group, `${position_data['position']} - Domestic Spending`);
	plot_title(foreign_group, `${position_data['position']} - Foreign Spending`);

	const domestic_data = position_data['domestic_spending'].map(d => isNaN(d) ? 0 : d);
	const foreign_data = position_data['foreign_spending'].map(d => isNaN(d) ? 0 : d);

	const domestic_percent = domestic_data.map((d, i) => i >= foreign_data.length ? 1 : (d) / (d + foreign_data[i]));
	const foreign_percent = foreign_data.map((d, i) => i >= domestic_data.length ? 1 : (d) / (d + domestic_data[i]));

	plot_percent_data(domestic_group, position_data['domestic_dates'], domestic_percent);
	plot_percent_data(foreign_group, position_data['foreign_dates'], foreign_percent)

	plot_data(domestic_group, position_data['domestic_dates'], domestic_data, position_confirmations);
	plot_data(foreign_group, position_data['foreign_dates'], foreign_data, position_confirmations);

};

const convert_to_relative_year = (date_str) => {
	const date = new Date(date_str);
	return date.getFullYear() + date.getDOY() / (date.isLeapYear() ? 366.0 : 365.0);
}


const init = async () => {
	await Promise.all([d3.json('data/cabinet-data-changes.json'),
		d3.csv('data/cabinet.csv')]).then(data => {
			const num_positions = data[0].length;

			const svg = d3.select('#main_svg').attr('width', PLOT_WIDTH*2).attr('height', PLOT_HEIGHT*num_positions);

			data[0].forEach((position_data, index) => {
				const position_confirmations = data[1].filter(d => d["Position"] === position_data['position']);
				console.log(position_data['position'])
				plot_position(svg, PLOT_HEIGHT*index, position_data, position_confirmations);
			});
	});
};



window.onload = () => {
	const svg = d3.select('#main_svg').attr('width', 600).attr('height', 400);
	init();
}
