import { useQuery } from '@tanstack/react-query'
import { getMenuProducts } from '../services/menu.service'

export const useGetMenuProducts = () => {
  return useQuery({
    queryKey: ['menu-products'],
    queryFn: getMenuProducts,
  })
}

