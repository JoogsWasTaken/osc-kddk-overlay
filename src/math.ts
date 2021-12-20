export const calcAttackDecay = (attack: number, decay: number, delta: number) => {
    const total = attack + decay;

    if (delta > total || delta < 0) return 0;
    if (delta <= attack) return delta / attack;

    delta -= attack;

    return 1 - (delta / decay);
}