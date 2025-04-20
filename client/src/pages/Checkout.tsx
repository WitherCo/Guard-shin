import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Flex,
  VStack,
  HStack,
  Radio,
  RadioGroup,
  useToast,
  Divider,
  Card,
  CardBody,
  Badge,
  SimpleGrid,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { FiCheck, FiShield, FiMusic, FiSettings, FiImage, FiBarChart, FiMessageCircle } from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Premium tier selection and pricing data
const PREMIUM_TIERS = {
  REGULAR: {
    name: "Premium",
    features: [
      "Auto-moderation",
      "Raid protection",
      "Custom welcome messages",
      "Advanced verification",
      "Music commands",
      "Basic analytics"
    ],
    pricing: {
      MONTHLY: 4.99,
      YEARLY: 49.99,
      LIFETIME: 149.99
    }
  },
  PLUS: {
    name: "Premium+",
    features: [
      "Everything in Premium",
      "Advanced analytics",
      "Custom welcome images",
      "Auto-response system",
      "Reaction roles",
      "Priority support",
      "Higher limits for all features"
    ],
    pricing: {
      MONTHLY: 9.99,
      YEARLY: 99.99,
      LIFETIME: 249.99
    }
  }
};

// Payment Form Component
const CheckoutForm = ({ tier, interval, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // For subscriptions
      if (interval !== 'LIFETIME') {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin + '/dashboard/premium/success'
          },
        });
        
        if (error) {
          toast({
            title: "Payment failed",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        // For one-time payments (lifetime)
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin + '/dashboard/premium/success'
          },
        });
        
        if (error) {
          toast({
            title: "Payment failed",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} width="100%">
      <Box mb={6}>
        <PaymentElement />
      </Box>
      
      <Button 
        colorScheme="purple" 
        size="lg" 
        width="100%" 
        type="submit" 
        isLoading={isProcessing}
        loadingText="Processing"
        disabled={!stripe || isProcessing}
      >
        Pay ${amount}
      </Button>
      
      <Text fontSize="sm" color="gray.500" mt={4} textAlign="center">
        Your payment is secure and encrypted. By proceeding with payment, you agree to our Terms of Service.
      </Text>
    </Box>
  );
};

// Main Checkout Component
const Checkout = () => {
  const [selectedTier, setSelectedTier] = useState('REGULAR');
  const [selectedInterval, setSelectedInterval] = useState('MONTHLY');
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const activeBgColor = useColorModeValue('purple.50', 'purple.900');
  const activeBorderColor = useColorModeValue('purple.500', 'purple.400');

  // Parse URL parameters if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tier = params.get('tier');
    const interval = params.get('interval');
    
    if (tier && Object.keys(PREMIUM_TIERS).includes(tier)) {
      setSelectedTier(tier);
    }
    
    if (interval && ['MONTHLY', 'YEARLY', 'LIFETIME'].includes(interval)) {
      setSelectedInterval(interval);
    }
  }, [location]);

  // Create payment intent or subscription
  useEffect(() => {
    const createPaymentIntent = async () => {
      setIsLoading(true);
      try {
        let response;
        
        if (selectedInterval === 'LIFETIME') {
          // Create one-time payment for lifetime subscription
          response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tier: selectedTier === 'REGULAR' ? 'lifetime_regular' : 'lifetime_plus',
              paymentType: 'lifetime',
            }),
          });
        } else {
          // Create subscription
          response = await fetch('/api/get-or-create-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tier: selectedTier.toLowerCase(),
              interval: selectedInterval === 'MONTHLY' ? 'monthly' : 'yearly',
            }),
          });
        }
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to initialize payment');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        toast({
          title: "Error",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        console.error('Payment initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (selectedTier && selectedInterval) {
      createPaymentIntent();
    }
  }, [selectedTier, selectedInterval, toast]);

  // Calculate the amount to charge
  const amount = PREMIUM_TIERS[selectedTier].pricing[selectedInterval];

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>Upgrade to Guard-shin Premium</Heading>
          <Text color="gray.500">Unlock advanced moderation and protection features for your Discord server</Text>
        </Box>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
          <Box>
            <Heading as="h3" size="md" mb={4}>Choose Your Plan</Heading>
            
            {/* Tier Selection */}
            <RadioGroup
              onChange={setSelectedTier}
              value={selectedTier}
              mb={6}
            >
              <SimpleGrid columns={1} spacing={4}>
                {Object.entries(PREMIUM_TIERS).map(([key, tier]) => (
                  <Card 
                    key={key}
                    variant="outline"
                    borderWidth="1px"
                    borderColor={selectedTier === key ? activeBorderColor : 'transparent'}
                    bg={selectedTier === key ? activeBgColor : cardBgColor}
                    cursor="pointer"
                    onClick={() => setSelectedTier(key)}
                    transition="all 0.2s"
                    _hover={{ shadow: 'md' }}
                  >
                    <CardBody>
                      <Radio value={key} mb={2} size="lg">
                        <HStack>
                          <Heading size="md">{tier.name}</Heading>
                          {key === 'PLUS' && (
                            <Badge colorScheme="purple" ml={2}>Best Value</Badge>
                          )}
                        </HStack>
                      </Radio>
                      
                      <VStack align="start" spacing={2} ml={6} mt={2}>
                        {tier.features.map((feature, index) => (
                          <HStack key={index} spacing={2}>
                            <Icon as={FiCheck} color="green.500" />
                            <Text>{feature}</Text>
                          </HStack>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </RadioGroup>
            
            {/* Interval Selection */}
            <Heading as="h3" size="md" mb={4}>Select Billing Cycle</Heading>
            <RadioGroup
              onChange={setSelectedInterval}
              value={selectedInterval}
              mb={6}
            >
              <SimpleGrid columns={1} spacing={4}>
                <Card 
                  variant="outline"
                  borderWidth="1px"
                  borderColor={selectedInterval === 'MONTHLY' ? activeBorderColor : 'transparent'}
                  bg={selectedInterval === 'MONTHLY' ? activeBgColor : cardBgColor}
                  cursor="pointer"
                  onClick={() => setSelectedInterval('MONTHLY')}
                  transition="all 0.2s"
                  _hover={{ shadow: 'md' }}
                >
                  <CardBody>
                    <Radio value="MONTHLY">
                      <Flex justify="space-between" width="100%">
                        <Text fontWeight="bold">Monthly</Text>
                        <Text>${PREMIUM_TIERS[selectedTier].pricing.MONTHLY}/month</Text>
                      </Flex>
                    </Radio>
                  </CardBody>
                </Card>
                
                <Card 
                  variant="outline"
                  borderWidth="1px"
                  borderColor={selectedInterval === 'YEARLY' ? activeBorderColor : 'transparent'}
                  bg={selectedInterval === 'YEARLY' ? activeBgColor : cardBgColor}
                  cursor="pointer"
                  onClick={() => setSelectedInterval('YEARLY')}
                  transition="all 0.2s"
                  _hover={{ shadow: 'md' }}
                >
                  <CardBody>
                    <Radio value="YEARLY">
                      <Flex justify="space-between" width="100%">
                        <Box>
                          <Text fontWeight="bold">Annual</Text>
                          <Badge colorScheme="green">Save 16%</Badge>
                        </Box>
                        <Text>${PREMIUM_TIERS[selectedTier].pricing.YEARLY}/year</Text>
                      </Flex>
                    </Radio>
                  </CardBody>
                </Card>
                
                <Card 
                  variant="outline"
                  borderWidth="1px"
                  borderColor={selectedInterval === 'LIFETIME' ? activeBorderColor : 'transparent'}
                  bg={selectedInterval === 'LIFETIME' ? activeBgColor : cardBgColor}
                  cursor="pointer"
                  onClick={() => setSelectedInterval('LIFETIME')}
                  transition="all 0.2s"
                  _hover={{ shadow: 'md' }}
                >
                  <CardBody>
                    <Radio value="LIFETIME">
                      <Flex justify="space-between" width="100%">
                        <Box>
                          <Text fontWeight="bold">Lifetime</Text>
                          <Badge colorScheme="purple">Best Deal</Badge>
                        </Box>
                        <Text>${PREMIUM_TIERS[selectedTier].pricing.LIFETIME}</Text>
                      </Flex>
                    </Radio>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </RadioGroup>
            
            <Box mt={6}>
              <Heading as="h4" size="sm" mb={2}>Alternative Payment Methods</Heading>
              <Text fontSize="sm" mb={4}>
                We also accept PayPal ($ChristopherThomas429) and CashApp ($kingsweets2004) payments. Contact us on our support server for details.
              </Text>
              <Button 
                leftIcon={<FiMessageCircle />}
                colorScheme="blue" 
                variant="outline"
                size="sm"
                as="a"
                href="https://discord.gg/g3rFbaW6gw"
                target="_blank"
              >
                Join Support Server
              </Button>
            </Box>
          </Box>
          
          <Box>
            <Heading as="h3" size="md" mb={4}>Payment Details</Heading>
            <Card variant="outline">
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Flex justify="space-between">
                    <Text fontWeight="bold">{PREMIUM_TIERS[selectedTier].name}</Text>
                    <Text>${PREMIUM_TIERS[selectedTier].pricing[selectedInterval]}</Text>
                  </Flex>
                  
                  <Flex justify="space-between" color="gray.500">
                    <Text>Plan</Text>
                    <Text>{selectedInterval === 'MONTHLY' ? 'Monthly' : 
                           selectedInterval === 'YEARLY' ? 'Annual' : 'Lifetime'}</Text>
                  </Flex>
                  
                  <Divider />
                  
                  <Flex justify="space-between" fontWeight="bold">
                    <Text>Total</Text>
                    <Text>${PREMIUM_TIERS[selectedTier].pricing[selectedInterval]}</Text>
                  </Flex>
                </VStack>
              </CardBody>
            </Card>
            
            <Box mt={6}>
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                  <CheckoutForm 
                    tier={selectedTier} 
                    interval={selectedInterval} 
                    amount={PREMIUM_TIERS[selectedTier].pricing[selectedInterval]} 
                  />
                </Elements>
              ) : (
                <Box 
                  p={10} 
                  borderRadius="md" 
                  borderWidth="1px"
                  textAlign="center"
                >
                  <Text>Loading payment options...</Text>
                </Box>
              )}
            </Box>
          </Box>
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

export default Checkout;