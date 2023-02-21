export default () => ({
	allDays: [],
	activeDay: 0,
	activeDayPercentage: 0,
	activeProgress: {},
	loaded: 0,
	maxDay: 0,
	combinedDailyLoss: [],
	maxSum: 0,
	daysToIgnore: [3, 5, 8, 20],
	currentProgress: {
		personnel:					0,
		tanks:						0,
		apv:						0,
		artillery_units:			0,
		mlrs:						0,
		air_defense_systems:		0,
		planes:						0,
		helicopters:				0,
		boats_and_warships:			0,
		uav:						0,
		special_equipment:			0,
		vehicles_and_fuel_tanks:	0,
		cruise_missiles:			0,
	},
	fetchData() {
		fetch('/list.JSON')
			.then((response) => response.json())
			.then((days) => {
				this.allDays = days;
				this.calculateCumulative();
			});
	},
	handleKeyPress() {
		if (this.loaded !== 100) return;

		if (event.keyCode === 37 && this.activeDay !== 3) {
			this.calculateProgress(this.activeDay - 1)
		}

		if (event.keyCode === 39 && this.activeDay !== this.maxDay) {
			this.calculateProgress(this.activeDay + 1)
		}
	},
	calculateProgress(nextDay) {
		const intNextDay = parseInt(nextDay)
		let inRange = false;

		if (this.activeDay > intNextDay) {
			const reversedDays = [...this.allDays].reverse();

			reversedDays.every(day => {
				if (this.activeDay === day.day) inRange = true;

				if (day.day === intNextDay) {
					this.activeDay = day.day;
					this.activeProgress = day;
					return false;
				}

				if (day.day !== intNextDay && inRange) {
					Object.keys(day.losses).forEach(type => {
						this.currentProgress[type] -= day.losses[type];
					})

					this.activeDay = day.day;
					this.activeProgress = day;
				}
				return true;
			});
		}

		if (this.activeDay < intNextDay) {

			this.allDays.every(day => {
				if (inRange) {
					Object.keys(day.losses).forEach(type => {
						this.currentProgress[type] += day.losses[type];
					})

					this.activeDay = day.day;
					this.activeProgress = day;
				}

				if (this.activeDay === day.day) inRange = true;

				if (day.day === intNextDay) {
					return false;
				}

				return true;
			});
		}

		this.getCombinedDailyLoss(this.activeProgress.day);
	},
	calculateCumulative() {
		let fraction = 0;

		this.allDays.map((day, index, days) => {

			setTimeout(() => {
				Object.keys(day.losses).forEach(type => {
					this.currentProgress[type] += day.losses[type];
				})

				this.activeDay = day.day;
				this.activeProgress = day;
				this.maxDay = day.day;

				this.combinedDailyLoss.push(Object.values(day.losses).reduce((a, b) => a + b, 0));

				fraction = parseInt((index + 1) / days.length * 100);

				if (fraction % 5 === 0 && fraction !== this.loaded) {
					this.$refs.root.style.setProperty('--loaded', fraction + "%");
					this.loaded = fraction;
				}

				if (this.loaded === 100) {
					this.maxSum = Math.max(...this.combinedDailyLoss.filter((sum, index) => !this.daysToIgnore.includes(index + 3)));
					this.getCombinedDailyLoss(this.activeProgress.day);
				}
			}, index * 10);
		});
	},
	formatNumber(number) {
		return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	},
	formatChange(number) {
		return number > 0 ? '+' + number : number;
	},
	getCombinedDailyLoss(day) {
		const percentage = this.combinedDailyLoss[day - 3] / this.maxSum * 100;
		this.activeDayPercentage = percentage.toFixed(0);
		this.$refs.root.style.setProperty('--dailyCombined', percentage + "%");
	}
})
