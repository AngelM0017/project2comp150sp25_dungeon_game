
import pygame
import random
import json
from typing import Dict, List, Optional

class Character:
    def __init__(self, name: str, char_type: str):
        self.name = name
        self.type = char_type
        self.health = 100
        self.max_health = 100
        self.mana = 50 if char_type in ['Mage', 'FrostRevenant', 'CelestialMonk'] else 0
        self.max_mana = self.mana
        self.attack = 15
        self.defense = 10
        self.is_alive = True

class Monster:
    def __init__(self, name: str, health: int, attack: int, defense: int):
        self.name = name
        self.health = health
        self.max_health = health
        self.attack = attack
        self.defense = defense
        self.is_alive = True

class Game:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((800, 600))
        pygame.display.set_caption("Dungeon Game")
        
        self.clock = pygame.time.Clock()
        self.running = True
        
        self.player: Optional[Character] = None
        self.current_floor = 1
        self.monsters: List[Monster] = []
        self.selected_move = "Basic Attack"
        self.in_battle = False
        
        # Initialize game states
        self.game_state = "menu"  # menu, playing, battle, game_over
        self.init_game_data()
        
    def init_game_data(self):
        self.movesets = {
            'Swordsman': {
                'Basic Attack': {'damage': [5, 15], 'mana': 0},
                'Heavy Strike': {'damage': [15, 25], 'mana': 0},
                'Quick Slash': {'damage': [8, 12], 'mana': 0},
                'Blade Dance': {'damage': [12, 20], 'mana': 0}
            },
            'Mage': {
                'Fireball': {'damage': [15, 25], 'mana': 5},
                'Water Lance': {'damage': [12, 18], 'mana': 10},
                'Wind Cutter': {'damage': [10, 16], 'mana': 12},
                'Thunder Bolt': {'damage': [18, 28], 'mana': 18}
            }
        }
        
    def create_character(self, name: str, char_type: str) -> None:
        self.player = Character(name, char_type)
        self.game_state = "playing"
        
    def generate_monster(self) -> Monster:
        monster_types = [
            ("Goblin", 30, 8, 5),
            ("Orc", 50, 12, 8),
            ("Troll", 70, 15, 12),
            ("Dragon", 100, 20, 15)
        ]
        name, health, attack, defense = random.choice(monster_types)
        return Monster(name, health, attack, defense)
        
    def handle_combat(self, move: str) -> Dict:
        if not self.player or not self.monsters:
            return {"success": False, "message": "Invalid combat state"}
            
        monster = self.monsters[0]  # Current target
        move_data = self.movesets[self.player.type][move]
        
        # Check mana cost
        if move_data['mana'] > self.player.mana:
            return {"success": False, "message": "Not enough mana"}
            
        # Calculate damage
        damage = random.randint(*move_data['damage'])
        final_damage = max(1, damage - monster.defense // 2)
        
        # Apply damage
        monster.health -= final_damage
        self.player.mana -= move_data['mana']
        
        result = {
            "success": True,
            "damage_dealt": final_damage,
            "monster_health": monster.health,
            "player_mana": self.player.mana
        }
        
        # Check if monster defeated
        if monster.health <= 0:
            monster.is_alive = False
            result["monster_defeated"] = True
            
        # Monster counterattack
        if monster.is_alive:
            counter_damage = max(1, monster.attack - self.player.defense // 2)
            self.player.health -= counter_damage
            result["counter_damage"] = counter_damage
            
            if self.player.health <= 0:
                self.player.is_alive = False
                result["player_defeated"] = True
                
        return result
        
    def run(self):
        while self.running:
            self.handle_events()
            self.update()
            self.render()
            self.clock.tick(60)
            
        pygame.quit()
        
    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                self.handle_keypress(event.key)
            elif event.type == pygame.MOUSEBUTTONDOWN:
                self.handle_mouse_click(event.pos)
                
    def update(self):
        if self.game_state == "playing":
            self.update_game_state()
        elif self.game_state == "battle":
            self.update_battle_state()
            
    def render(self):
        self.screen.fill((0, 0, 0))
        
        if self.game_state == "menu":
            self.render_menu()
        elif self.game_state == "playing":
            self.render_game()
        elif self.game_state == "battle":
            self.render_battle()
        elif self.game_state == "game_over":
            self.render_game_over()
            
        pygame.display.flip()
        
    def handle_keypress(self, key):
        if self.game_state == "playing":
            if key == pygame.K_ESCAPE:
                self.running = False
                
    def handle_mouse_click(self, pos):
        if self.game_state == "menu":
            self.handle_menu_click(pos)
        elif self.game_state == "battle":
            self.handle_battle_click(pos)

if __name__ == "__main__":
    game = Game()
    game.run()
