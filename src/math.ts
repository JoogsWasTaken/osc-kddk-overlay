/**
 * Computes the values on a linear attack-decay time function.
 * You can imagine it as a graph that starts at 0.
 * It then rises linearly up to 1 for values between 0 and attack.
 * After that, it falls linearly down to 0 for values between attack and attack + decay.
 * Delta represents the time value to get the computed function value for.
 * For out-of-range values, this function returns 0.
 * This documentation is scuffed but that's the best way I can explain it.
 * 
 * @param attack Attack time span
 * @param decay Decay time span
 * @param delta Point in time to query function output for
 * @returns Value in range of 0 to 1
 */
export const calcAttackDecay = (attack: number, decay: number, delta: number) => {
    const total = attack + decay;

    if (delta > total || delta < 0) return 0; // out of range
    if (delta <= attack) return delta / attack; // in attack range

    delta -= attack; // in decay range

    return 1 - (delta / decay);
}