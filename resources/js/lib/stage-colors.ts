/** Colores de las etapas del embudo (deben coincidir con PipelineStage::COLORS). */
export const STAGE_COLORS: Record<string, { dot: string; label: string }> = {
    blue: { dot: 'bg-[#3b5bff]', label: 'Azul' },
    cyan: { dot: 'bg-[#22d3ee]', label: 'Cian' },
    violet: { dot: 'bg-[#8b5cf6]', label: 'Violeta' },
    amber: { dot: 'bg-[#f2b544]', label: 'Ámbar' },
    orange: { dot: 'bg-[#fb923c]', label: 'Naranja' },
    green: { dot: 'bg-[#3ccb8c]', label: 'Verde' },
    red: { dot: 'bg-[#f06a6a]', label: 'Rojo' },
    slate: { dot: 'bg-[#9097a6]', label: 'Gris' },
};

export const stageDot = (color: string) =>
    STAGE_COLORS[color]?.dot ?? STAGE_COLORS.slate.dot;
