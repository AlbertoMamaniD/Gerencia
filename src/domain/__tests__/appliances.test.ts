import {
  calculateApplianceMonthlyKWh,
  calculateHouseholdSummary,
  DEFAULT_TARIJA_APPLIANCES,
} from '../appliances';

describe('appliances domain', () => {
  it('calcula correctamente los kWh mensuales de un electrodoméstico', () => {
    // Ducha de 4500W usada 0.5h (30 min) al día durante 30 días
    // (4500 * 1 * 0.5 * 30) / 1000 = 67.5 kWh
    const kwh = calculateApplianceMonthlyKWh({
      id: 'ducha',
      name: 'Ducha',
      category: 'bano',
      icon: 'shower-head',
      powerWatts: 4500,
      quantity: 1,
      hoursPerDay: 0.5,
      daysPerMonth: 30,
    });
    expect(kwh).toBe(67.5);
  });

  it('devuelve 0 si la potencia o cantidad son cero o negativas', () => {
    expect(
      calculateApplianceMonthlyKWh({
        id: 'test',
        name: 'Test',
        category: 'otros',
        icon: 'lightning-bolt',
        powerWatts: 0,
        quantity: 1,
        hoursPerDay: 2,
      })
    ).toBe(0);

    expect(
      calculateApplianceMonthlyKWh({
        id: 'test',
        name: 'Test',
        category: 'otros',
        icon: 'lightning-bolt',
        powerWatts: 100,
        quantity: 0,
        hoursPerDay: 2,
      })
    ).toBe(0);
  });

  it('calcula el resumen de consumo del hogar y detecta el mayor consumidor', () => {
    const summary = calculateHouseholdSummary(DEFAULT_TARIJA_APPLIANCES, 0.74);

    expect(summary.totalMonthlyKWh).toBeGreaterThan(0);
    expect(summary.totalMonthlyCostBs).toBeGreaterThan(0);
    expect(summary.items.length).toBe(DEFAULT_TARIJA_APPLIANCES.length);
    expect(summary.topConsumer).not.toBeNull();
    // La ducha o la heladera deben ser los principales
    expect(['ducha-electrica', 'heladera']).toContain(summary.topConsumer?.item.id);
    expect(summary.recommendedSavingsBs).toBeGreaterThan(0);
  });

  it('ordena los aparatos de mayor a menor consumo en Bs', () => {
    const summary = calculateHouseholdSummary(DEFAULT_TARIJA_APPLIANCES, 0.85);
    for (let i = 0; i < summary.items.length - 1; i++) {
      expect(summary.items[i].monthlyCostBs).toBeGreaterThanOrEqual(summary.items[i + 1].monthlyCostBs);
    }
  });

  it('maneja listas vacías de electrodomésticos sin errores', () => {
    const summary = calculateHouseholdSummary([], 0.74);
    expect(summary.totalMonthlyKWh).toBe(0);
    expect(summary.totalMonthlyCostBs).toBe(0);
    expect(summary.items).toHaveLength(0);
    expect(summary.topConsumer).toBeNull();
    expect(summary.recommendedSavingsBs).toBe(0);
  });
});
