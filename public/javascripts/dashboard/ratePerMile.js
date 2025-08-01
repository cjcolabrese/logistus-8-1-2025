document.addEventListener('DOMContentLoaded', () => {
    const rateInput = document.querySelector('input[name="rate[amount]"]');
    const distanceInput = document.getElementById('distance');
    const ratePerMileInput = document.querySelector('input[name="ratePerMile[amount]"]');

    let isUserEditingRate = false;
    let isUserEditingRPM = false;

    const calculateRatePerMile = () => {
        if (isUserEditingRPM) return; // avoid circular update
        const rate = parseFloat(rateInput.value);
        const distance = parseFloat(distanceInput.value);

        if (!isNaN(rate) && !isNaN(distance) && distance > 0) {
            const rpm = rate / distance;
            ratePerMileInput.value = rpm.toFixed(2);
        } else {
            ratePerMileInput.value = '';
        }
    };

    const calculateRateFromRPM = () => {
        if (isUserEditingRate) return; // avoid circular update
        const rpm = parseFloat(ratePerMileInput.value);
        const distance = parseFloat(distanceInput.value);

        if (!isNaN(rpm) && !isNaN(distance) && distance > 0) {
            const rate = rpm * distance;
            rateInput.value = rate.toFixed(2);
        } else {
            rateInput.value = '';
        }
    };

    if (rateInput && distanceInput && ratePerMileInput) {
        rateInput.addEventListener('input', () => {
            isUserEditingRate = true;
            isUserEditingRPM = false;
            calculateRatePerMile();
            isUserEditingRate = false;
        });

        ratePerMileInput.addEventListener('input', () => {
            isUserEditingRPM = true;
            isUserEditingRate = false;
            calculateRateFromRPM();
            isUserEditingRPM = false;
        });

        distanceInput.addEventListener('input', () => {
            calculateRatePerMile();
            calculateRateFromRPM();
        });

        distanceInput.addEventListener('change', () => {
            calculateRatePerMile();
            calculateRateFromRPM();
        });
    }
});