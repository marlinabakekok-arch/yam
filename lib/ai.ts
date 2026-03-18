export async function generateProductDescription(
  productId: string,
  category: string
): Promise<string> {
  try {
    const response = await fetch(`/api/admin/products/${productId}/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate description')
    }

    const data = await response.json()
    return data.description
  } catch (error) {
    console.error('AI description generation failed:', error)
    throw error
  }
}
