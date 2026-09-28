export function formatDeviceLabel(device: { brand: string; model: string | null }): string {
  return device.model ? `${device.brand} ${device.model}` : device.brand
}
