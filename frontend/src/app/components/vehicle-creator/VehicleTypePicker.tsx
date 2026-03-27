import { motion } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';
import { VehicleType } from '../../pages/VehicleCreator';
import { Truck, Box, Container, Snowflake } from 'lucide-react';

interface VehicleTypeData {
  type: VehicleType;
  label: string;
  icon: any;
  description: string;
  specs: {
    length: string;
    trucks: number;
    loadLimit: string;
  };
}

const VEHICLE_TYPES: VehicleTypeData[] = [
  {
    type: 'boxcar',
    label: 'Boxcar',
    icon: Box,
    description: 'Enclosed railcar for general freight',
    specs: { length: '50-60 ft', trucks: 2, loadLimit: '220,000 lbs' },
  },
  {
    type: 'flatcar',
    label: 'Flatcar',
    icon: Container,
    description: 'Open platform for heavy loads',
    specs: { length: '50-89 ft', trucks: 2, loadLimit: '280,000 lbs' },
  },
  {
    type: 'gondola',
    label: 'Gondola',
    icon: Truck,
    description: 'Open-top car for bulk materials',
    specs: { length: '52-65 ft', trucks: 2, loadLimit: '260,000 lbs' },
  },
  {
    type: 'reefer',
    label: 'Reefer',
    icon: Snowflake,
    description: 'Refrigerated car for temperature-sensitive cargo',
    specs: { length: '50-57 ft', trucks: 2, loadLimit: '200,000 lbs' },
  },
];

interface Props {
  value: VehicleType;
  onChange: (type: VehicleType) => void;
}

export function VehicleTypePicker({ value, onChange }: Props) {
  const { isDark, palette } = useTheme();

  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';

  return (
    <div className="space-y-3">
      <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Select Vehicle Type
      </div>

      {VEHICLE_TYPES.map(vehicleType => {
        const Icon = vehicleType.icon;
        const isSelected = value === vehicleType.type;

        return (
          <motion.button
            key={vehicleType.type}
            onClick={() => onChange(vehicleType.type)}
            className="w-full text-left p-4 rounded-xl transition-all"
            style={{
              background: isSelected ? palette.primary + '15' : cardBg,
              border: `2px solid ${isSelected ? palette.primary : border}`,
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{
                  width: 48,
                  height: 48,
                  background: isSelected ? palette.primary : (isDark ? '#1E2A38' : '#F1F5F9'),
                  color: isSelected ? '#ffffff' : palette.primary,
                }}
              >
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <div style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, marginBottom: 4 }}>
                  {vehicleType.label}
                </div>
                <div style={{ fontSize: '12px', color: text, marginBottom: 8 }}>
                  {vehicleType.description}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div style={{ fontSize: '10px', color: text, textTransform: 'uppercase' }}>Length</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: textPrimary }}>{vehicleType.specs.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: text, textTransform: 'uppercase' }}>Trucks</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: textPrimary }}>{vehicleType.specs.trucks}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: text, textTransform: 'uppercase' }}>Max Load</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: textPrimary }}>{vehicleType.specs.loadLimit}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
