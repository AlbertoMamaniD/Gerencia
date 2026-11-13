import {
  calculateDetailedSetarBill,
  getSetarBracketStatus,
} from '../setarTariff';

describe('setarTariff domain', () => {
  describe('getSetarBracketStatus', () => {
    it('activa Tarifa Dignidad si el consumo es <= 70 kWh', () => {
      const status = getSetarBracketStatus(50, 0.74);
      expect(status.type).toBe('dignidad');
      expect(status.hasDignidadSubsidy).toBe(true);
      expect(status.kwhRemainingToNextBracket).toBe(20);
      expect(status.dignidadDiscountBs).toBeGreaterThan(0);
    });

    it('clasifica consumo normal entre 71 y 300 kWh', () => {
      const status = getSetarBracketStatus(150, 0.74);
      expect(status.type).toBe('normal');
      expect(status.hasDignidadSubsidy).toBe(false);
      expect(status.dignidadDiscountBs).toBe(0);
      expect(status.kwhRemainingToNextBracket).toBe(150);
    });

    it('alerta cuando está cerca del límite de 300 kWh', () => {
      const status = getSetarBracketStatus(285, 0.74);
      expect(status.type).toBe('normal');
      expect(status.tone).toBe('warning');
      expect(status.kwhRemainingToNextBracket).toBe(15);
    });

    it('clasifica alto consumo con penalidad cuando supera 300 kWh', () => {
      const status = getSetarBracketStatus(350, 0.74);
      expect(status.type).toBe('alto_consumo');
      expect(status.tone).toBe('danger');
      expect(status.kwhRemainingToNextBracket).toBeNull();
    });
  });

  describe('calculateDetailedSetarBill', () => {
    it('calcula la factura completa incluyendo alumbrado público y aseo EMAT', () => {
      const bill = calculateDetailedSetarBill({
        energyKWh: 100,
        ratePerKWh: 0.74,
        publicLightingPct: 8,
        ematSanitationBs: 15,
      });

      // 100 kWh * 0.74 = Bs 74.00
      expect(bill.rawEnergyCostBs).toBe(74);
      expect(bill.dignidadDiscountBs).toBe(0);
      expect(bill.netEnergyCostBs).toBe(74);
      // Alumbrado 8% de 74 = Bs 5.92
      expect(bill.publicLightingBs).toBe(5.92);
      // EMAT = 15
      expect(bill.ematSanitationBs).toBe(15);
      // Total = 74 + 5.92 + 15 = 94.92
      expect(bill.totalBillBs).toBe(94.92);
    });

    it('aplica el descuento del 25% para consumos dentro de Tarifa Dignidad', () => {
      const bill = calculateDetailedSetarBill({
        energyKWh: 40,
        ratePerKWh: 1.0,
        publicLightingPct: 10,
        ematSanitationBs: 10,
      });

      // 40 kWh * 1.0 = 40 Bs
      expect(bill.rawEnergyCostBs).toBe(40);
      // 25% descuento = 10 Bs
      expect(bill.dignidadDiscountBs).toBe(10);
      expect(bill.netEnergyCostBs).toBe(30);
      // 10% alumbrado de 30 = 3 Bs
      expect(bill.publicLightingBs).toBe(3);
      // EMAT = 10
      expect(bill.ematSanitationBs).toBe(10);
      // Total = 30 + 3 + 10 = 43 Bs
      expect(bill.totalBillBs).toBe(43);
    });

    it('aplica recargo por alto consumo para kWh > 300', () => {
      const bill = calculateDetailedSetarBill({
        energyKWh: 350,
        ratePerKWh: 1.0,
        publicLightingPct: 0,
        ematSanitationBs: 0,
      });

      // Base 300 * 1.0 = 300 Bs
      // Exceso 50 * (1.0 * 1.20) = 60 Bs
      // Total = 360 Bs
      expect(bill.rawEnergyCostBs).toBe(360);
      expect(bill.totalBillBs).toBe(360);
    });
  });
});
