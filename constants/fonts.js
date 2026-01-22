/**
 * Font family mapping for Nunito
 * Maps font weights to their corresponding Nunito font families
 */
export const FontFamily = {
	light: 'Quicksand_300Light',
	regular: 'Quicksand_400Regular',
	medium: 'Quicksand_500Medium',
	semiBold: 'Quicksand_600SemiBold',
	bold: 'Quicksand_700Bold'
};

/**
 * Get font family based on weight
 * Usage: getFontFamily('700') or getFontFamily(700)
 */
export function getFontFamily(weight) {
	const w = String(weight);

	switch (w) {
		case '400':
		case 'normal':
			return FontFamily.regular;
		case '600':
		case 'semibold':
			return FontFamily.semiBold;
		case '700':
		case 'bold':
			return FontFamily.bold;
		case '800':
		case 'extrabold':
			return FontFamily.extraBold;
		case '900':
		case 'black':
			return FontFamily.black;
		default:
			return FontFamily.regular;
	}
}
