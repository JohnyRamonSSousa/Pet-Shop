
import React from 'react';
import { 
  Dog, 
  Cat, 
  ShieldCheck, 
  HeartPulse, 
  Bath, 
  Syringe, 
  Home, 
  Scissors 
} from 'lucide-react';
import { Product, PetService } from './types';

export const PET_SERVICES: PetService[] = [
  {
    id: 'banho-tosa',
    title: 'Banho & Tosa',
    description: 'Cuidados estéticos com produtos hipoalergênicos e profissionais especializados.',
    icon: <Bath className="w-8 h-8 text-teal-600" />,
    price: 'A partir de R$ 80'
  },
  {
    id: 'vacinacao',
    title: 'Vacinação',
    description: 'Protocolo completo de vacinas para garantir a saúde preventiva do seu pet.',
    icon: <Syringe className="w-8 h-8 text-orange-500" />,
    price: 'Sob consulta'
  },
  {
    id: 'hospedagem',
    title: 'Hospedagem',
    description: 'Ambiente seguro e divertido para seu pet enquanto você viaja com tranquilidade.',
    icon: <Home className="w-8 h-8 text-teal-600" />,
    price: 'Diárias R$ 120'
  },
  {
    id: 'vet',
    title: 'Clínica 24h',
    description: 'Atendimento veterinário completo com infraestrutura para exames e cirurgias.',
    icon: <HeartPulse className="w-8 h-8 text-orange-500" />
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Ração Premium Adulto',
    category: 'racao',
    price: 189.90,
    petType: 'cao',
    imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=400',
    description: 'Nutrição completa para cães de médio e grande porte.'
  },
  {
    id: 'p2',
    name: 'Arranhador Torre Cat',
    category: 'brinquedo',
    price: 245.00,
    petType: 'gato',
    imageUrl: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&q=80&w=400',
    description: 'Diversão e desgaste de unhas em um só lugar.'
  },
  {
    id: 'p3',
    name: 'Brinquedo Mordedor Interativo',
    category: 'brinquedo',
    price: 45.90,
    petType: 'cao',
    imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=400',
    description: 'Resistente e ideal para gastar energia.'
  },
  {
    id: 'p4',
    name: 'Shampoo Neutro 500ml',
    category: 'higiene',
    price: 32.50,
    petType: 'outros',
    imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=400',
    description: 'Fragrância suave e limpeza profunda.'
  }
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: 'Fabiana Melo',
    content: 'O melhor atendimento que meu Golden já recebeu. A equipe de banho e tosa é maravilhosa!',
    pet: 'Max (Golden Retriever)',
    avatar: 'https://i.pravatar.cc/150?u=fabiana'
  },
  {
    id: 2,
    name: 'André Soares',
    content: 'Agendei a consulta pelo site e foi super rápido. O veterinário foi muito atencioso.',
    pet: 'Luna (Persa)',
    avatar: 'https://i.pravatar.cc/150?u=andre'
  }
];
