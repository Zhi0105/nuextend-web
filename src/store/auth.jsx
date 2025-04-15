import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'


const userStore = persist(
    (set) => ({
        user: null,
        token: null,
        setUser: (data) => set(() => ({
            user: data
        })),
        setToken: (data) => set(() => ({
            token: data
        })),
        setUserLogout: () => set(() => ({ token: null, user: null }))
    }),
    {
        name: 'user',
        storage: createJSONStorage(() => localStorage),
    })

export const useUserStore = create(userStore)