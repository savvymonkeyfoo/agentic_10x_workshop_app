/**
 * Calculates the Efficiency Ratio (ROI Multiplier).
 * 
 * New Logic: Fixed ROI mapping based strictly on Business Value score.
 * 
 * Mapping:
 * 1 -> 1.7x
 * 2 -> 2.5x
 * 3 -> 4.0x
 * 4 -> 7.0x
 * 5 -> 10.0x (The Goal)
 */
export const calculateEfficiencyRatio = (value: number, _complexity?: number): number => {
    // Ensure input is valid, default to 3
    const v = value || 3;

    switch (Math.round(v)) {
        case 1: return 1.7;
        case 2: return 2.5;
        case 3: return 4.0;
        case 4: return 7.0;
        case 5: return 10.0;
        default: return 4.0; // Fallback to medium
    }
};
